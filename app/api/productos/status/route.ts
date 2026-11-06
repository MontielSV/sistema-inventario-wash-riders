import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export async function PATCH(request: Request) {
  try {
    // 1. Verificamos si podemos leer el cuerpo del mensaje
    const body = await request.json();
    const { id, disponible } = body;
    
    console.log("Datos recibidos en API:", id, disponible);

    // 2. Intentamos la consulta a Postgres
    const result = await pool.query(
      'UPDATE productos SET disponible = $1 WHERE id = $2 RETURNING *',
      [disponible, id]
    );

    // 3. Si la base de datos respondió, mandamos éxito
    return NextResponse.json({ ok: true, data: result.rows[0] });

  } catch (error: any) {
    // ESTO ES LO MÁS IMPORTANTE: Mira la terminal de VS Code (la de letras blancas)
    // ahí aparecerá el nombre real del error.
    console.error("DETALLE DEL ERROR EN EL SERVIDOR:", error.message);
    
    return NextResponse.json(
      { error: "Error interno", detalle: error.message }, 
      { status: 500 }
    );
  }
}