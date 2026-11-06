import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import pool from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { ensureInventoryTables } from '@/lib/inventory-db';

export const runtime = 'nodejs';

interface ItemVenta {
  producto_id: number;
  cantidad: number;
}

function createTrackingCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `WR-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items as ItemVenta[] : [];
    const tipo = body.tipo;
    const detalle = typeof body.motivo === 'string' ? body.motivo.trim() : '';

    if (!items.length || items.length > 100) {
      return NextResponse.json({ error: 'Agrega entre 1 y 100 productos.' }, { status: 400 });
    }

    if (!['VENTA', 'USO_INTERNO', 'OTRO'].includes(tipo)) {
      return NextResponse.json({ error: 'Selecciona un motivo válido para la salida.' }, { status: 400 });
    }

    if (tipo === 'OTRO' && (!detalle || detalle.length > 140)) {
      return NextResponse.json({ error: 'Escribe un detalle de hasta 140 caracteres para esta salida.' }, { status: 400 });
    }

    const cantidadesPorProducto = new Map<number, number>();
    for (const item of items) {
      const productoId = Number(item?.producto_id);
      const cantidad = Number(item?.cantidad);
      if (!Number.isInteger(productoId) || productoId < 1 || !Number.isInteger(cantidad) || cantidad < 1) {
        return NextResponse.json({ error: 'Cada producto debe tener una cantidad entera mayor a cero.' }, { status: 400 });
      }
      cantidadesPorProducto.set(productoId, (cantidadesPorProducto.get(productoId) || 0) + cantidad);
    }

    await ensureInventoryTables();
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    const productoIds = [...cantidadesPorProducto.keys()].sort((a, b) => a - b);
    const productos = await client.query(
      'SELECT id, codigo, nombre, stock_actual, precio FROM productos WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
      [productoIds]
    );

    if (productos.rowCount !== productoIds.length) {
      throw Object.assign(new Error('Uno o más productos no existen en el catálogo.'), { status: 404 });
    }

    const productosPorId = new Map(productos.rows.map((producto) => [Number(producto.id), producto]));
    for (const [productoId, cantidad] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId)!;
      if (Number(producto.stock_actual) < cantidad) {
        throw Object.assign(
          new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock_actual}, solicitado: ${cantidad}.`),
          { status: 409 }
        );
      }
    }

    const transaccionId = randomUUID();
    const codigoSeguimiento = tipo === 'VENTA' ? createTrackingCode() : null;
    const motivo = tipo === 'VENTA' ? 'Venta' : tipo === 'USO_INTERNO' ? 'Uso interno' : detalle;
    const movimientos = [];
    let total = 0;

    for (const [productoId, cantidad] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId)!;
      const precio = Number(producto.precio);
      const subtotal = precio * cantidad;
      await client.query(
        'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
        [cantidad, productoId]
      );
      const result = await client.query(
        `INSERT INTO movimientos
          (producto_id, tipo, cantidad, motivo_tipo, motivo, precio_unitario, fecha, transaccion_id, codigo_seguimiento)
         VALUES ($1, 'SALIDA', $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7)
         RETURNING id, producto_id, tipo, cantidad, motivo_tipo, motivo, precio_unitario, fecha,
           transaccion_id, codigo_seguimiento`,
        [productoId, cantidad, tipo, motivo, precio, transaccionId, codigoSeguimiento]
      );
      movimientos.push({
        ...result.rows[0],
        codigo_producto: producto.codigo,
        nombre_producto: producto.nombre,
        subtotal,
      });
      total += subtotal;
    }

    await client.query('COMMIT');
    transactionStarted = false;
    return NextResponse.json({
      exito: true,
      transaccion_id: transaccionId,
      codigo_seguimiento: codigoSeguimiento,
      tipo,
      motivo,
      total,
      items: movimientos,
      mensaje: tipo === 'VENTA' ? 'Venta registrada y stock actualizado.' : 'Salida registrada y stock actualizado.',
    }, { status: 201 });
  } catch (error) {
    if (client && transactionStarted) await client.query('ROLLBACK');
    console.error('Error al registrar venta o salida por lote:', error);
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number(error.status)
      : 500;
    const message = error instanceof Error ? error.message : 'No se pudo registrar la operación.';
    return NextResponse.json({ error: message }, { status });
  } finally {
    client?.release();
  }
}