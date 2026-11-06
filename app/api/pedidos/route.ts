import { Pool } from 'pg';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  let client;
  try {
    client = await pool.connect();
    // Verificamos o creamos la columna de forma transparente si aún no existe
    await client.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS caja_cerrada BOOLEAN DEFAULT false;
    `);

    const result = await client.query(`
      SELECT 
        id, cliente_nombre, direccion, telefono, producto_id, cantidad, estado, total, metodo_pago, notas, items, 
        fecha,
        COALESCE(caja_cerrada, false) AS caja_cerrada,
        EXTRACT(EPOCH FROM fecha) * 1000 AS fecha_milisegundos
      FROM pedidos 
      ORDER BY id DESC
    `);
    client.release();
    return NextResponse.json(result.rows);
  } catch (err) {
    if (client) client.release();
    console.error("Error SQL en GET /api/pedidos:", err);
    return NextResponse.json({ error: 'Error al consultar pedidos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let client;
  try {
    const body = await request.json();
    const { cliente_nombre, direccion, telefono, producto_id, cantidad, total, metodo_pago, notas, items } = body;

    client = await pool.connect();
    
    const query = `
      INSERT INTO pedidos (cliente_nombre, direccion, telefono, producto_id, cantidad, estado, total, metodo_pago, notas, items, fecha) 
      VALUES ($1, $2, $3, $4, $5, 'Pendiente', $6, $7, $8, $9, CURRENT_TIMESTAMP) 
      RETURNING *, EXTRACT(EPOCH FROM fecha) * 1000 AS fecha_milisegundos
    `;
    
    const itemsValue = items ? (typeof items === 'string' ? items : JSON.stringify(items)) : null;

    const values = [
      cliente_nombre || 'Sin nombre', 
      direccion || 'Sin dirección', 
      telefono || '',
      producto_id || null, 
      cantidad || 1, 
      total || 0, 
      metodo_pago || 'Efectivo', 
      notas || '', 
      itemsValue
    ];

    const result = await client.query(query, values);
    client.release();

    return NextResponse.json({ message: '¡Pedido creado con éxito!', pedido: result.rows[0] }, { status: 201 });
  } catch (err) {
    if (client) client.release();
    console.error("Error SQL en POST /api/pedidos:", err);
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let client;
  try {
    const body = await request.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return NextResponse.json({ error: 'Faltan datos requeridos (id o estado)' }, { status: 400 });
    }

    client = await pool.connect();
    
    await client.query('BEGIN'); 

    const pedidoActualRes = await client.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    
    // 🔥 CORRECCIÓN: Usamos .rows.length en vez de rowCount
    if (pedidoActualRes.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release(); 
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    const pedidoAnterior = pedidoActualRes.rows[0];

    if (pedidoAnterior.estado !== estado) {
      const multiplicador = estado === 'Completado' ? -1 : (estado === 'Pendiente' ? 1 : 0);

      if (multiplicador !== 0) {
        let itemsDelPedido = [];
        if (pedidoAnterior.items) {
          itemsDelPedido = typeof pedidoAnterior.items === 'string' ? JSON.parse(pedidoAnterior.items) : pedidoAnterior.items;
        } else if (pedidoAnterior.producto_id) {
          itemsDelPedido = [{ producto_id: pedidoAnterior.producto_id, cantidad: pedidoAnterior.cantidad || 1 }];
        }

        for (const item of itemsDelPedido) {
          let productoRealId = item.producto_id || item.id;
          if (!productoRealId && item.nombre) {
            const prodRes = await client.query('SELECT id FROM productos WHERE nombre = $1 LIMIT 1', [item.nombre]);
            // 🔥 CORRECCIÓN: Usamos .rows.length
            if (prodRes.rows.length > 0) productoRealId = prodRes.rows[0].id;
          }

          if (productoRealId) {
            const recetaRes = await client.query('SELECT insumo_id, cantidad_usada FROM receta_producto WHERE producto_id = $1', [productoRealId]);
            
            for (const ingrediente of recetaRes.rows) {
              const cantidadAModificar = ingrediente.cantidad_usada * (item.cantidad || 1) * multiplicador;
              
              await client.query(`
                UPDATE inventario 
                SET cantidad = cantidad + $1, ultima_actualizacion = CURRENT_TIMESTAMP 
                WHERE id = $2
              `, [cantidadAModificar, ingrediente.insumo_id]);
            }
          }
        }
      }
    }

    const query = `UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *`;
    const result = await client.query(query, [estado, id]);
    
    await client.query('COMMIT'); 
    client.release();

    return NextResponse.json({ message: 'Estado e inventario actualizados', pedido: result.rows[0] });

  } catch (err) {
    if (client) {
      await client.query('ROLLBACK'); 
      client.release(); 
    }
    console.error("Error SQL en PUT /api/pedidos:", err);
    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let client;
  try {
    client = await pool.connect();
    // 1. Aseguramos la existencia de la columna caja_cerrada
    await client.query(`
      ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS caja_cerrada BOOLEAN DEFAULT false;
    `);

    // 2. Marcamos los pedidos completados como caja cerrada (NO SE BORRAN, se archivan)
    const updateResult = await client.query(`
      UPDATE pedidos 
      SET caja_cerrada = true 
      WHERE estado = 'Completado' AND (caja_cerrada IS FALSE OR caja_cerrada IS NULL)
      RETURNING id, total;
    `);

    // 3. Registramos el arqueo en la tabla de auditoría para control financiero
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS cierres_caja (
          id SERIAL PRIMARY KEY,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total NUMERIC DEFAULT 0,
          pedidos_afectados INT DEFAULT 0
        );
      `);
      const totalCerrado = updateResult.rows.reduce((acc, row) => acc + Number(row.total || 0), 0);
      await client.query(`
        INSERT INTO cierres_caja (total, pedidos_afectados) VALUES ($1, $2);
      `, [totalCerrado, updateResult.rows.length]);
    } catch (auditErr) {
      console.warn("Tabla cierres_caja no crítica:", auditErr);
    }
    client.release();
    return NextResponse.json({ 
      success: true, 
      message: 'Caja cerrada y turno archivado exitosamente. Los datos historicos se conservan intactos.', 
      pedidos_cerrados: updateResult.rows.length 
    });
  } catch (err) {
    if (client) client.release();
    return NextResponse.json({ error: 'Error al realizar el cierre de caja' }, { status: 500 });
  }
}