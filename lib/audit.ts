import type { PoolClient } from 'pg';
import pool from '@/lib/db';
import { getSessionIdentity, type SessionIdentity } from '@/lib/auth';

type AuditAction = 'inicio_sesion' | 'cierre_sesion' | 'intento_fallido' | 'crear' | 'editar' | 'eliminar' | 'registrar' | 'importar' | 'cerrar_caja';

interface AuditEvent {
  request: Request;
  action: AuditAction;
  entity: string;
  entityId?: string | number | null;
  details?: Record<string, unknown>;
  actor?: SessionIdentity;
}

let auditTableReady: Promise<void> | undefined;

export async function ensureAuditTable() {
  if (!auditTableReady) {
    auditTableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS historial_actividad (
        id BIGSERIAL PRIMARY KEY,
        fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        usuario TEXT NOT NULL,
        usuario_id INTEGER,
        accion TEXT NOT NULL,
        entidad TEXT NOT NULL,
        entidad_id TEXT,
        detalles JSONB NOT NULL DEFAULT '{}'::jsonb,
        ip TEXT,
        agente_usuario TEXT,
        origen TEXT
      )
    `).then(async () => {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_historial_actividad_fecha ON historial_actividad (fecha DESC)');
    }).then(() => undefined).catch((error: unknown) => {
      auditTableReady = undefined;
      throw error;
    });
  }
  await auditTableReady;
}

export async function recordAuditEvent(
  { request, action, entity, entityId = null, details = {}, actor }: AuditEvent,
  client?: PoolClient,
) {
  await ensureAuditTable();
  const identity = actor ?? getSessionIdentity(request);
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || null;
  const sourceUrl = request.headers.get('referer');
  let source = new URL(request.url).pathname;
  if (sourceUrl) {
    try {
      const referer = new URL(sourceUrl);
      source = `${referer.origin}${referer.pathname}`;
    } catch {
      source = new URL(request.url).pathname;
    }
  } else if (request.headers.get('origin')) {
    try {
      source = new URL(request.headers.get('origin')!).origin;
    } catch {
      source = new URL(request.url).pathname;
    }
  }

  const queryable = client ?? pool;
  await queryable.query(
    `INSERT INTO historial_actividad
      (usuario, usuario_id, accion, entidad, entidad_id, detalles, ip, agente_usuario, origen)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`,
    [
      identity?.nombre ? `${identity.nombre} (${identity.username})` : identity?.username ?? actor?.username ?? 'No identificado',
      identity?.userId ?? null,
      action,
      entity,
      entityId === null ? null : String(entityId),
      JSON.stringify(details),
      ip,
      request.headers.get('user-agent'),
      source,
    ],
  );
}
