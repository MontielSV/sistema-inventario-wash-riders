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
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = 100;
    if (!Number.isSafeInteger(page) || page < 1) {
      return NextResponse.json({ error: 'La página solicitada no es válida.' }, { status: 400 });
    }

    await ensureAuditTable();
    const offset = (page - 1) * pageSize;
    if (!Number.isSafeInteger(offset)) {
      return NextResponse.json({ error: 'La página solicitada no es válida.' }, { status: 400 });
    }

    const [countResult, result] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM historial_actividad'),
      pool.query(`
      SELECT id, fecha, usuario, accion, entidad, entidad_id, detalles, ip, agente_usuario, origen
      FROM historial_actividad
      ORDER BY fecha DESC, id DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]),
    ]);
    return NextResponse.json({
      entries: result.rows,
      total: countResult.rows[0].total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error al consultar el historial de actividad:', error);
    return NextResponse.json({ error: 'No se pudo consultar el historial de actividad' }, { status: 500 });
  }
}
