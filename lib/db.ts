import { Pool } from 'pg';

export const pool = new Pool({
  user: 'admin',
  host: '127.0.0.1',
  database: 'mrkings_pedidos', // <--- Cambiado según tu mensaje
  password: 'adminpassword',   // <--- Cambiado según tu mensaje
  port: 5432,
});