import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { usuario, password } = await request.json();

    const result = await pool.query(
      'SELECT id, usuario, nombre FROM usuarios WHERE usuario = $1 AND password = $2',
      [usuario, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      exito: true, 
      usuario: result.rows[0] 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}