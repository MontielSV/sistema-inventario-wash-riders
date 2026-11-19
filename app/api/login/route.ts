import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { recordAuditEvent } from '@/lib/audit';
import {
  clearSessionCookie,
  createSession,
  getSessionIdentity,
  hashPassword,
  isAuthenticated,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return NextResponse.json({ autenticado: isAuthenticated(request) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const usuario = typeof body.usuario === 'string' ? body.usuario.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!usuario || !password) {
      return NextResponse.json({ error: 'Ingresa usuario y contraseña' }, { status: 400 });
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL DEFAULT 'Administrador'
      )
    `);

    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD
      ?? (process.env.NODE_ENV !== 'production' ? 'admin123' : undefined);

    if (bootstrapPassword) {
      const admin = await pool.query('SELECT id FROM usuarios WHERE usuario = $1 LIMIT 1', ['admin']);
      if (admin.rowCount === 0) {
        await pool.query(
          'INSERT INTO usuarios (usuario, password, nombre) VALUES ($1, $2, $3)',
          ['admin', hashPassword(bootstrapPassword), 'Administrador']
        );
      }
    }

    const result = await pool.query(
      'SELECT id, usuario, nombre, password FROM usuarios WHERE usuario = $1 LIMIT 1',
      [usuario]
    );

    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password)) {
      await recordAuditEvent({
        request,
        action: 'intento_fallido',
        entity: 'sesion',
        details: { usuario: usuario.slice(0, 100) },
        actor: { username: usuario.slice(0, 100) || 'desconocido' },
      });
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    if (!user.password.startsWith('scrypt$')) {
      await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashPassword(password), user.id]);
    }

    const identity = { userId: Number(user.id), username: user.usuario, nombre: user.nombre };
    await recordAuditEvent({
      request,
      action: 'inicio_sesion',
      entity: 'sesion',
      actor: identity,
    });
    const response = NextResponse.json({
      exito: true,
      usuario: { id: user.id, usuario: user.usuario, nombre: user.nombre },
    });
    setSessionCookie(response, createSession(identity));
    return response;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return NextResponse.json({ error: 'No se pudo validar el acceso' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const identity = getSessionIdentity(request);
  if (identity) {
    try {
      await recordAuditEvent({ request, action: 'cierre_sesion', entity: 'sesion', actor: identity });
    } catch (error) {
      console.error('Error al registrar el cierre de sesión:', error);
      return NextResponse.json({ error: 'No se pudo registrar el cierre de sesión' }, { status: 500 });
    }
  }
  const response = NextResponse.json({ exito: true });
  clearSessionCookie(response);
  return response;
}