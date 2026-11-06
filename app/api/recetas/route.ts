import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: Request) {
  let client;
  try {
    const { searchParams } = new URL(request.url);
    const producto_id = searchParams.get('producto_id');
    
    if (!producto_id) return NextResponse.json({ error: 'Falta producto_id' }, { status: 400 });

    client = await pool.connect();
    const result = await client.query(`
      SELECT r.id, r.producto_id, r.insumo_id, r.cantidad_usada, i.nombre as nombre_insumo, i.unidad_medida 
      FROM receta_producto r 
      JOIN inventario i ON r.insumo_id = i.id 
      WHERE r.producto_id = $1
    `, [producto_id]);
    
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    if (client) client.release();
    return NextResponse.json({ error: 'Error BD' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let client;
  try {
    const body = await request.json();
    client = await pool.connect();

    if (Array.isArray(body)) {
      await client.query('BEGIN'); 
      try {
        await client.query('TRUNCATE TABLE receta_producto RESTART IDENTITY'); 
        
        for (const fila of body) {
          const nombrePlato = fila.Plato || fila.plato;
          const nombreInsumo = fila.Insumo || fila.insumo;
          const cantidad = parseFloat(fila.Cantidad || fila.cantidad || 0);

          if (nombrePlato && nombreInsumo && cantidad > 0) {
            const resPlato = await client.query('SELECT id FROM productos WHERE nombre ILIKE $1 LIMIT 1', [nombrePlato]);
            const resInsumo = await client.query('SELECT id FROM inventario WHERE nombre ILIKE $1 LIMIT 1', [nombreInsumo]);

            // 🔥 CORRECCIÓN CRÍTICA: Usamos .rows.length en lugar de rowCount para evitar errores
            if (resPlato.rows.length > 0 && resInsumo.rows.length > 0) {
              await client.query(
                'INSERT INTO receta_producto (producto_id, insumo_id, cantidad_usada) VALUES ($1, $2, $3)',
                [resPlato.rows[0].id, resInsumo.rows[0].id, cantidad]
              );
            }
          }
        }
        await client.query('COMMIT');
        client.release();
        return NextResponse.json({ success: true, message: '¡Recetas importadas con éxito!' });
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json({ error: 'Error al procesar el Excel' }, { status: 500 });
      }
    }

    const { producto_id, ingredientes } = body;
    await client.query('DELETE FROM receta_producto WHERE producto_id = $1', [producto_id]);
    
    for (const ing of ingredientes) {
      await client.query(
        'INSERT INTO receta_producto (producto_id, insumo_id, cantidad_usada) VALUES ($1, $2, $3)',
        [producto_id, ing.insumo_id, ing.cantidad_usada]
      );
    }
    client.release();
    return NextResponse.json({ success: true });

  } catch (error) {
    if (client) client.release();
    console.error("Error guardando receta:", error);
    return NextResponse.json({ error: 'Error guardando receta' }, { status: 500 });
  }
}