import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ autorizado: false, error: 'Correo requerido' }, { status: 400 });
    }

    const client = await pool.connect();
    const result = await client.query(
      "SELECT * FROM usuarios_admin WHERE LOWER(email) = LOWER($1) AND estado = 'Activo'",
      [email]
    );
    client.release();

    if (result.rows.length > 0) {
      const usuarioBD = result.rows[0];
      return NextResponse.json({ 
        autorizado: true, 
        rol: usuarioBD.rol, // <-- Retornamos el rol exacto (Root, Gerente, Supervisor, Cajero)
        usuario: usuarioBD 
      });
    } else {
      return NextResponse.json({ autorizado: false, error: 'Usuario no autorizado en el sistema' });
    }
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    return NextResponse.json({ autorizado: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
// DELETE: Eliminar un empleado de la BD con protección Root
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

    const client = await pool.connect();
    
    // Verificamos de seguridad extra: ¿El usuario a borrar es el Root?
    const userCheck = await client.query('SELECT email, rol FROM usuarios_admin WHERE id = $1', [id]);
    if (userCheck.rows.length > 0) {
      const targetUser = userCheck.rows[0];
      if (targetUser.rol.includes('Root') || targetUser.email.toLowerCase() === 'ediamadoc2006@gmail.com') {
        client.release();
        return NextResponse.json({ error: 'Operación denegada: No se puede eliminar al Administrador Root.' }, { status: 403 });
      }
    }

    await client.query('DELETE FROM usuarios_admin WHERE id = $1', [id]);
    client.release();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ error: 'Error de seguridad al procesar la solicitud' }, { status: 500 });
  }
}