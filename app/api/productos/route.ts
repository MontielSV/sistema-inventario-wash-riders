import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Obtener la lista de productos
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, nombre, categoria, stock_actual, stock_minimo, precio FROM productos ORDER BY id DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error al consultar productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener la lista de productos de la base de datos' },
      { status: 500 }
    );
  }
}

// POST: Registrar un nuevo producto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, categoria, stock_actual, stock_minimo, precio } = body;

    if (!nombre || precio === undefined) {
      return NextResponse.json(
        { error: 'El nombre y el precio son obligatorios' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO productos (nombre, categoria, stock_actual, stock_minimo, precio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, categoria || 'General', stock_actual || 0, stock_minimo || 5, precio]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error al insertar producto:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar el producto en la base de datos' },
      { status: 500 }
    );
  }
}