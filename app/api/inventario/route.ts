import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import pool from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { ensureInventoryTables } from '@/lib/inventory-db';

export const runtime = 'nodejs';

const MOTIVOS_VALIDOS = new Set(['COMPRA', 'VENTA', 'USO_INTERNO', 'DANO', 'DONACION', 'AJUSTE', 'OTRO']);

function movementDelta(tipo: 'ENTRADA' | 'SALIDA', cantidad: number) {
  return tipo === 'ENTRADA' ? cantidad : -cantidad;
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await ensureInventoryTables();
    const result = await pool.query(`
            SELECT m.id, m.producto_id, p.nombre AS nombre_producto, p.codigo AS codigo_producto,
                    m.tipo, m.cantidad, m.motivo_tipo, m.motivo, m.precio_unitario, m.fecha,
                    m.transaccion_id, m.codigo_seguimiento
      FROM movimientos m
      LEFT JOIN productos p ON p.id = m.producto_id
      ORDER BY m.fecha DESC, m.id DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al consultar movimientos:', error);
    return NextResponse.json({ error: 'Error en base de datos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let client: PoolClient | undefined;
  try {
    const body = await request.json();
    const productoId = Number(body.producto_id);
    const cantidad = Number(body.cantidad);
    const tipo = body.tipo;
    const motivoTipo = typeof body.motivo_tipo === 'string' ? body.motivo_tipo : (tipo === 'ENTRADA' ? 'COMPRA' : 'OTRO');
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : '';
    const fecha = body.fecha ? new Date(body.fecha) : new Date();

    if (
      !Number.isInteger(productoId) || productoId < 1 ||
      !Number.isInteger(cantidad) || cantidad < 1 ||
      (tipo !== 'ENTRADA' && tipo !== 'SALIDA') ||
      !MOTIVOS_VALIDOS.has(motivoTipo) ||
      (tipo === 'ENTRADA' && motivoTipo === 'VENTA') ||
      Number.isNaN(fecha.getTime())
    ) {
      return NextResponse.json({ error: 'Los datos del movimiento no son válidos' }, { status: 400 });
    }

    await ensureInventoryTables();
    client = await pool.connect();
    await client.query('BEGIN');
    const producto = await client.query(
      'SELECT id, stock_actual, precio FROM productos WHERE id = $1 AND COALESCE(disponible, TRUE) = TRUE FOR UPDATE',
      [productoId]
    );

    if (producto.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const nuevoStock = Number(producto.rows[0].stock_actual) + movementDelta(tipo, cantidad);
    if (nuevoStock < 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Stock insuficiente para registrar esta salida' }, { status: 409 });
    }

    await client.query('UPDATE productos SET stock_actual = $1 WHERE id = $2', [nuevoStock, productoId]);
    const result = await client.query(
      `INSERT INTO movimientos (producto_id, tipo, cantidad, motivo_tipo, motivo, precio_unitario, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [productoId, tipo, cantidad, motivoTipo, motivo, producto.rows[0].precio, fecha]
    );
    await client.query('COMMIT');
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al registrar movimiento:', error);
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 });
  } finally {
    client?.release();
  }
}

export async function PUT(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let client: PoolClient | undefined;
  try {
    const body = await request.json();
    const id = Number(body.id);
    const productoId = Number(body.producto_id);
    const cantidad = Number(body.cantidad);
    const tipo = body.tipo;
    const motivoTipo = body.motivo_tipo;
    const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : '';
    const fecha = new Date(body.fecha);

    if (
      !Number.isInteger(id) || id < 1 || !Number.isInteger(productoId) || productoId < 1 ||
      !Number.isInteger(cantidad) || cantidad < 1 ||
      (tipo !== 'ENTRADA' && tipo !== 'SALIDA') ||
      typeof motivoTipo !== 'string' || !MOTIVOS_VALIDOS.has(motivoTipo) ||
      (tipo === 'ENTRADA' && motivoTipo === 'VENTA') || Number.isNaN(fecha.getTime())
    ) {
      return NextResponse.json({ error: 'Los datos del movimiento no son válidos' }, { status: 400 });
    }

    await ensureInventoryTables();
    client = await pool.connect();
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM movimientos WHERE id = $1 FOR UPDATE', [id]);
    if (existing.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
    }

    const old = existing.rows[0];
    if (old.motivo_tipo === 'VENTA' || old.transaccion_id) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Las ventas agrupadas se conservan como una sola operación y no se editan desde movimientos manuales.' },
        { status: 409 }
      );
    }
    const productIds = [...new Set([Number(old.producto_id), productoId])].sort((a, b) => a - b);
    const products = await client.query(
      'SELECT id, stock_actual, precio FROM productos WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
      [productIds]
    );
    if (products.rowCount !== productIds.length) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const stockById = new Map(products.rows.map((product) => [Number(product.id), Number(product.stock_actual)]));
    const oldProductId = Number(old.producto_id);
    const restoredOldStock = stockById.get(oldProductId)! - movementDelta(old.tipo, Number(old.cantidad));
    const nextStock = productoId === oldProductId
      ? restoredOldStock + movementDelta(tipo, cantidad)
      : stockById.get(productoId)! + movementDelta(tipo, cantidad);

    if (restoredOldStock < 0 || nextStock < 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'El cambio dejaría un producto con stock negativo' }, { status: 409 });
    }

    await client.query('UPDATE productos SET stock_actual = $1 WHERE id = $2', [restoredOldStock, oldProductId]);
    await client.query('UPDATE productos SET stock_actual = $1 WHERE id = $2', [nextStock, productoId]);
    const productPrice = products.rows.find((product) => Number(product.id) === productoId)?.precio;
    const result = await client.query(
      `UPDATE movimientos
       SET producto_id = $1, tipo = $2, cantidad = $3, motivo_tipo = $4,
           motivo = $5, precio_unitario = $6, fecha = $7
       WHERE id = $8 RETURNING *`,
      [productoId, tipo, cantidad, motivoTipo, motivo, productPrice, fecha, id]
    );
    await client.query('COMMIT');
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al actualizar movimiento:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  } finally {
    client?.release();
  }
}