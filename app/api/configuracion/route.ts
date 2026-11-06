import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM configuracion_negocio WHERE id = 1');
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        tienda_abierta: true, 
        whatsapp_numero: '573000000000', 
        nombre_negocio: 'Mr Kings Arepa',
        slogan: 'Sabor de Sofi',
        hora_apertura: '14:00',
        hora_cierre: '23:30',
        costo_domicilio: 0,
        mensaje_whatsapp_custom: '¡Hola! Quiero hacer el siguiente pedido:',
        aviso_banner: 'Abierto',
        formato_impresora: '58mm',
        pie_pagina_ticket: '¡Gracias por tu compra!',
        descuento_web_activo: false,
        descuento_web_porcentaje: 0
      });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error en GET configuración:", error);
    return NextResponse.json({ error: 'Error al consultar' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      tienda_abierta, 
      whatsapp_numero, 
      nombre_negocio, 
      slogan, 
      hora_apertura, 
      hora_cierre, 
      costo_domicilio, 
      mensaje_whatsapp_custom, 
      aviso_banner,
      formato_impresora,
      pie_pagina_ticket,
      descuento_web_activo,
      descuento_web_porcentaje
    } = body;
    
    const client = await pool.connect();
    
    const result = await client.query(
      `UPDATE configuracion_negocio 
       SET tienda_abierta = $1, 
           whatsapp_numero = $2,
           nombre_negocio = $3,
           slogan = $4,
           hora_apertura = $5,
           hora_cierre = $6,
           costo_domicilio = $7,
           mensaje_whatsapp_custom = $8,
           aviso_banner = $9,
           formato_impresora = $10,
           pie_pagina_ticket = $11,
           descuento_web_activo = $12,
           descuento_web_porcentaje = $13
       WHERE id = 1
       RETURNING *`,
      [
        tienda_abierta, 
        whatsapp_numero, 
        nombre_negocio, 
        slogan, 
        hora_apertura, 
        hora_cierre, 
        costo_domicilio, 
        mensaje_whatsapp_custom, 
        aviso_banner,
        formato_impresora,
        pie_pagina_ticket,
        descuento_web_activo,
        descuento_web_porcentaje
      ]
    );
    
    client.release();
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error en PUT configuración:", error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}