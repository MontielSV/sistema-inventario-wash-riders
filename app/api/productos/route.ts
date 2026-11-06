import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Leer todos los productos del catálogo
export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM productos ORDER BY id DESC');
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json({ error: 'Error en base de datos' }, { status: 500 });
  }
}

// POST: Crear un nuevo producto desde el panel de admin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, categoria, imagen, disponible } = body;

    const client = await pool.connect();
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, categoria, imagen, disponible) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const values = [nombre, descripcion, precio, categoria, imagen, disponible];
    
    const result = await client.query(query, values);
    client.release();
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json({ error: 'Error al registrar el producto' }, { status: 500 });
  }
}

// DELETE: Eliminar un producto
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

    const client = await pool.connect();
    await client.query('DELETE FROM productos WHERE id = $1', [id]);
    client.release();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json({ error: 'Error interno al eliminar' }, { status: 500 });
  }
}

// PUT: Actualizar un producto (Edición completa o solo disponibilidad)
export async function PUT(request: Request) {
  let client;
  try {
    const body = await request.json();
    client = await pool.connect();

    // 1. Edición completa desde el Modal (incluye imagen, nombre, precio, etc.)
    if (body.nombre) {
      const { id, nombre, descripcion, precio, categoria, imagen } = body;
      
      const query = `
        UPDATE productos 
        SET nombre = $1, descripcion = $2, precio = $3, categoria = $4, imagen = $5 
        WHERE id = $6 RETURNING *;
      `;
      const values = [nombre, descripcion, precio, categoria, imagen, id];
      
      const result = await client.query(query, values);
      client.release();
      return NextResponse.json(result.rows[0]);
    } 
    
    // 2. Solo pausar o activar disponibilidad desde el botón de la tabla
    else if (body.disponible !== undefined) {
      const { id, disponible } = body;
      
      const query = 'UPDATE productos SET disponible = $1 WHERE id = $2 RETURNING *;';
      const result = await client.query(query, [disponible, id]);
      
      client.release();
      return NextResponse.json(result.rows[0]);
    }

    client.release();
    return NextResponse.json({ error: 'Faltan datos para actualizar' }, { status: 400 });

  } catch (error) {
    if (client) client.release();
    console.error('Error al actualizar el producto:', error);
    return NextResponse.json({ error: 'Error actualizando disponibilidad' }, { status: 500 });
  }
}