import pool from '@/lib/db';

export async function ensureInventoryTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      codigo TEXT,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'General',
      precio NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
      stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
      stock_minimo INTEGER NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0)
    )
  `);
  await pool.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo TEXT');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      motivo TEXT NOT NULL DEFAULT '',
      motivo_tipo TEXT NOT NULL DEFAULT 'OTRO',
      precio_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
      fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query("ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS motivo_tipo TEXT NOT NULL DEFAULT 'OTRO'");
  await pool.query('ALTER TABLE movimientos ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0');
}