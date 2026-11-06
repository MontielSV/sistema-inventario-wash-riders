import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const { items, motivo, tipo, total } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Agrega al menos un producto a la venta.' }, { status: 400 });
    }

    if (motivo.startsWith('Otro:') && motivo.length > 145) {
      return NextResponse.json({ error: 'El detalle del motivo "Otro" debe tener máximo 140 caracteres.' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Generar código de seguimiento único solo si es VENTA
    const esVenta = tipo === 'VENTA' || motivo === 'Venta';
    const codigoSeguimiento = esVenta 
      ? `WR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
      : '-';

    // 2. Validar stock de TODOS los productos antes de escribir
    for (const item of items) {
      const prodRes = await client.query('SELECT id, nombre, stock_actual, precio FROM productos WHERE id = $1', [item.producto_id]);
      if (prodRes.rows.length === 0) {
        throw new Error(`El producto seleccionado ya no existe en el catálogo.`);
      }
      const prod = prodRes.rows[0];
      if (prod.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock_actual}, solicitado: ${item.cantidad}.`);
      }
    }

    // 3. Ejecutar descuentos y guardar movimientos históricos
    for (const item of items) {
      const prodRes = await client.query('SELECT codigo, nombre, precio FROM productos WHERE id = $1', [item.producto_id]);
      const prod = prodRes.rows[0];
      const precioAplicado = item.precio_unitario || prod.precio;
      const subtotalCalculado = item.cantidad * precioAplicado;

      // Descontar existencias
      await client.query(
        'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );

      // Registrar movimiento
      await client.query(
        `INSERT INTO movimientos 
          (producto_id, tipo, cantidad, motivo, codigo_seguimiento, precio_unitario, subtotal, fecha)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          item.producto_id,
          esVenta ? 'VENTA' : 'SALIDA',
          item.cantidad,
          motivo,
          codigoSeguimiento,
          precioAplicado,
          subtotalCalculado,
        ]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ 
      exito: true, 
      codigo_seguimiento: codigoSeguimiento,
      mensaje: esVenta ? 'Venta registrada y disponibilidad actualizada.' : 'Salida registrada y disponibilidad actualizada.'
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally {
    client.release();
  }
}