import type { PoolClient } from 'pg';

export async function lockProductCodeAllocation(client: PoolClient) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('wrc-product-code-allocation-v1'))");
}

export async function findAvailableProductCode(client: PoolClient): Promise<string | null> {
  const result = await client.query<{ codigo: string }>(`
    SELECT 'WRC-' || LPAD(candidato.numero::text, 3, '0') AS codigo
    FROM generate_series(1, 999) AS candidato(numero)
    WHERE NOT EXISTS (
      SELECT 1
      FROM productos
      WHERE UPPER(BTRIM(productos.codigo)) = 'WRC-' || LPAD(candidato.numero::text, 3, '0')
    )
    ORDER BY candidato.numero
    LIMIT 1
  `);
  return result.rows[0]?.codigo ?? null;
}
