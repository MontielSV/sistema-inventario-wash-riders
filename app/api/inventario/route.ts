import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const client = await pool.connect();
    // Traemos TODO. Ordenamos primero por si está activo, luego por categoría y nombre.
    const result = await client.query('SELECT * FROM inventario ORDER BY activo DESC, categoria ASC, nombre ASC');
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Error en base de datos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await pool.connect();

    if (Array.isArray(body)) {
      await client.query('TRUNCATE TABLE inventario RESTART IDENTITY');
      
      for (const item of body) {
        await client.query(
          `INSERT INTO inventario (nombre, cantidad, unidad_medida, stock_minimo, categoria, activo) VALUES ($1, $2, $3, $4, $5, true)`,
          [
            item.nombre || item.Nombre, 
            item.cantidad || item.Cantidad || 0, 
            item.unidad_medida || item.Unidad || 'Unidad', 
            item.stock_minimo || item.StockMinimo || 5,
            item.categoria || item.Categoria || 'Materia Prima'
          ]
        );
      }
      client.release();
      return NextResponse.json({ success: true }, { status: 201 });
    } 
    
    const { nombre, cantidad, unidad_medida, stock_minimo, categoria } = body;
    const result = await client.query(
      `INSERT INTO inventario (nombre, cantidad, unidad_medida, stock_minimo, categoria, activo) VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [nombre, cantidad, unidad_medida, stock_minimo, categoria]
    );
    client.release();
    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 });
  }
}

// AQUÍ ESTÁ LA MAGIA DEL BOTÓN ACTIVO/INACTIVO Y EL STOCK
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const client = await pool.connect();
    
    // Si la petición manda "accion: 'toggle'", apagamos o prendemos
    if (body.accion === 'toggle') {
      const result = await client.query(
        'UPDATE inventario SET activo = $1 WHERE id = $2 RETURNING *',
        [body.activo, body.id]
      );
      client.release();
      return NextResponse.json(result.rows[0]);
    } 
    // Si no, es que estamos sumando o restando cantidades
    else {
      const result = await client.query(
        'UPDATE inventario SET cantidad = $1, ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [body.cantidad, body.id]
      );
      client.release();
      return NextResponse.json(result.rows[0]);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error actualizando' }, { status: 500 });
  }
}

// Mantenemos el delete por si acaso, pero ya no lo usaremos en la interfaz
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const client = await pool.connect();
    await client.query('DELETE FROM inventario WHERE id = $1', [id]);
    client.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}