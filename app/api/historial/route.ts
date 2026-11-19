import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { ensureAuditTable } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await ensureAuditTable();
    const result = await pool.query(`
      SELECT id, fecha, usuario, accion, entidad, entidad_id, detalles, ip, agente_usuario, origen
      FROM historial_actividad
      ORDER BY fecha DESC, id DESC
      LIMIT 500
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al consultar el historial de actividad:', error);
    return NextResponse.json({ error: 'No se pudo consultar el historial de actividad' }, { status: 500 });
  }
}
