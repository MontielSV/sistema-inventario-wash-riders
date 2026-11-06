import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { ensureInventoryTables } from '@/lib/inventory-db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await ensureInventoryTables();
    const result = await pool.query(
      'SELECT id, codigo, nombre, categoria, stock_actual, stock_minimo, precio FROM productos WHERE COALESCE(disponible, TRUE) = TRUE ORDER BY id DESC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al consultar productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener la lista de productos de la base de datos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { codigo, nombre, categoria, stock_actual, stock_minimo, precio } = body;
    const stockActual = Number(stock_actual);
    const stockMinimo = Number(stock_minimo);
    const precioProducto = Number(precio);

    if (
      typeof codigo !== 'string' || !codigo.trim() ||
      typeof nombre !== 'string' || !nombre.trim() ||
      typeof categoria !== 'string' || !categoria.trim() ||
      !Number.isInteger(stockActual) || stockActual < 0 ||
      !Number.isInteger(stockMinimo) || stockMinimo < 0 ||
      !Number.isFinite(precioProducto) || precioProducto < 0
    ) {
      return NextResponse.json(
        { error: 'Completa todos los campos con valores válidos y no negativos' },
        { status: 400 }
      );
    }

    await ensureInventoryTables();
    const duplicate = await pool.query(
      'SELECT id FROM productos WHERE LOWER(codigo) = LOWER($1) LIMIT 1',
      [codigo.trim()]
    );
    if (duplicate.rowCount) {
      return NextResponse.json({ error: 'El código de producto ya está registrado' }, { status: 409 });
    }

    const result = await pool.query(
      `INSERT INTO productos (codigo, nombre, categoria, stock_actual, stock_minimo, precio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [codigo.trim(), nombre.trim(), categoria.trim(), stockActual, stockMinimo, precioProducto]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error al insertar producto:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar el producto en la base de datos' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const stockActual = Number(body.stock_actual);
    const stockMinimo = Number(body.stock_minimo);
    const precio = Number(body.precio);

    if (
      !Number.isInteger(id) || id < 1 ||
      typeof body.codigo !== 'string' || !body.codigo.trim() ||
      typeof body.nombre !== 'string' || !body.nombre.trim() ||
      typeof body.categoria !== 'string' || !body.categoria.trim() ||
      !Number.isInteger(stockActual) || stockActual < 0 ||
      !Number.isInteger(stockMinimo) || stockMinimo < 0 ||
      !Number.isFinite(precio) || precio < 0
    ) {
      return NextResponse.json(
        { error: 'Completa todos los campos con valores válidos y no negativos' },
        { status: 400 }
      );
    }

    await ensureInventoryTables();
    const duplicate = await pool.query(
      'SELECT id FROM productos WHERE LOWER(codigo) = LOWER($1) AND id <> $2 LIMIT 1',
      [body.codigo.trim(), id]
    );
    if (duplicate.rowCount) {
      return NextResponse.json({ error: 'El código de producto ya está registrado' }, { status: 409 });
    }

    const result = await pool.query(
      `UPDATE productos
       SET codigo = $1, nombre = $2, categoria = $3,
           stock_actual = $4, stock_minimo = $5, precio = $6
       WHERE id = $7
       RETURNING *`,
      [body.codigo.trim(), body.nombre.trim(), body.categoria.trim(), stockActual, stockMinimo, precio, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el producto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: 'El producto seleccionado no es válido' }, { status: 400 });
    }

    await ensureInventoryTables();
    const result = await pool.query(
      'UPDATE productos SET disponible = FALSE WHERE id = $1 AND COALESCE(disponible, TRUE) = TRUE RETURNING id',
      [id]
    );
    if (!result.rowCount) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('Error al retirar producto del catálogo:', error);
    return NextResponse.json({ error: 'No se pudo retirar el producto del catálogo' }, { status: 500 });
  }
}