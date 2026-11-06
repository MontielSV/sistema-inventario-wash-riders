import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Obtener todos los empleados de la BD
export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM usuarios_admin ORDER BY id DESC');
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ error: 'Error al conectar con la base de datos' }, { status: 500 });
  }
}

// POST: Crear un nuevo empleado en la BD
export async function POST(request: Request) {
  try {
    const { nombre, email, rol, estado } = await request.json();
    const client = await pool.connect();
    const query = `
      INSERT INTO usuarios_admin (nombre, email, rol, estado) 
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const values = [nombre, email, rol, estado || 'Activo'];
    const result = await client.query(query, values);
    client.release();
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return NextResponse.json({ error: 'Error al registrar en la base de datos' }, { status: 500 });
  }
}

// DELETE: Eliminar un empleado de la BD
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

    const client = await pool.connect();
    await client.query('DELETE FROM usuarios_admin WHERE id = $1', [id]);
    client.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar en la base de datos' }, { status: 500 });
  }
}