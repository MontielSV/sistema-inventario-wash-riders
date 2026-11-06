import { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';
import { isAuthenticated } from '@/lib/auth';
import pool from '@/lib/db';
import { ensureInventoryTables } from '@/lib/inventory-db';
import { WR_PRODUCT_NAMES } from '@/lib/wr-product-list';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let client: PoolClient | undefined;
  try {
    await ensureInventoryTables();
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('wr-colombia-catalog-v1'))");

    let agregados = 0;
    let existentes = 0;
    const retirado = await client.query(
      `UPDATE productos SET disponible = FALSE
      WHERE COALESCE(disponible, TRUE) = TRUE
         AND (LOWER(BTRIM(nombre)) = 'bolt' OR LOWER(BTRIM(codigo)) = 'bolt')
       RETURNING id`
    );
    const codigos = WR_PRODUCT_NAMES.map((_, indice) => `WRC-${String(indice + 1).padStart(3, '0')}`);
    const inserted = await client.query(
      `INSERT INTO productos (codigo, nombre, categoria, stock_actual, stock_minimo, precio)
       SELECT catalogo.codigo, catalogo.nombre, 'General', 0, 4, 0
       FROM UNNEST($1::text[], $2::text[]) AS catalogo(codigo, nombre)
       WHERE NOT EXISTS (
         SELECT 1 FROM productos existente
         WHERE LOWER(BTRIM(existente.nombre)) = LOWER(BTRIM(catalogo.nombre))
            OR LOWER(BTRIM(existente.codigo)) = LOWER(BTRIM(catalogo.codigo))
       )
       RETURNING id`,
      [codigos, WR_PRODUCT_NAMES]
    );
    agregados = inserted.rowCount || 0;
    existentes = WR_PRODUCT_NAMES.length - agregados;

    await client.query('COMMIT');
    return NextResponse.json({
      agregados,
      existentes,
      retirados: retirado.rowCount || 0,
      total: WR_PRODUCT_NAMES.length,
    }, { status: 201 });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al importar catálogo WR Colombia:', error);
    return NextResponse.json({ error: 'No se pudo agregar el catálogo WR Colombia' }, { status: 500 });
  } finally {
    client?.release();
  }
}