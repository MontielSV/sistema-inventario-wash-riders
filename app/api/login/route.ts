import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  clearSessionCookie,
  createSession,
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
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    if (!user.password.startsWith('scrypt$')) {
      await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashPassword(password), user.id]);
    }

    const response = NextResponse.json({
      exito: true,
      usuario: { id: user.id, usuario: user.usuario, nombre: user.nombre },
    });
    setSessionCookie(response, createSession(usuario));
    return response;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return NextResponse.json({ error: 'No se pudo validar el acceso' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ exito: true });
  clearSessionCookie(response);
  return response;
}