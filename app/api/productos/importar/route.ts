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

    let agregados = 0;
    let existentes = 0;
    for (const [indice, nombre] of WR_PRODUCT_NAMES.entries()) {
      const codigo = `WRC-${String(indice + 1).padStart(3, '0')}`;
      const encontrado = await client.query(
        'SELECT id FROM productos WHERE LOWER(nombre) = LOWER($1) OR LOWER(codigo) = LOWER($2) LIMIT 1',
        [nombre, codigo]
      );
      if (encontrado.rowCount) {
        existentes += 1;
        continue;
      }

      await client.query(
        `INSERT INTO productos (codigo, nombre, categoria, stock_actual, stock_minimo, precio)
         VALUES ($1, $2, 'General', 0, 4, 0)`,
        [codigo, nombre]
      );
      agregados += 1;
    }

    await client.query('COMMIT');
    return NextResponse.json({ agregados, existentes, total: WR_PRODUCT_NAMES.length }, { status: 201 });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al importar catálogo WR Colombia:', error);
    return NextResponse.json({ error: 'No se pudo agregar el catálogo WR Colombia' }, { status: 500 });
  } finally {
    client?.release();
  }
}