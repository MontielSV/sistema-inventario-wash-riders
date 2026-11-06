import { Pool } from 'pg';
import { NextResponse } from 'next/server';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  let client;
  try {
    client = await pool.connect();

    // 1. CREACIÓN Y LECTURA DE LA META EN BD (Auto-reparable)
    let metaDiaria = 1000000; // Valor por defecto
    try {
      const configQuery = await client.query('SELECT meta_diaria FROM configuracion LIMIT 1');
      if (configQuery.rows.length > 0) {
        metaDiaria = Number(configQuery.rows[0].meta_diaria);
      } else {
        await client.query('INSERT INTO configuracion (meta_diaria) VALUES ($1)', [metaDiaria]);
      }
    } catch (e) {
      // Si la tabla no existe, la crea automáticamente en PostgreSQL
      await client.query(`
        CREATE TABLE IF NOT EXISTS configuracion (
          id SERIAL PRIMARY KEY,
          meta_diaria NUMERIC DEFAULT 1000000
        );
        INSERT INTO configuracion (meta_diaria) VALUES (1000000);
      `);
    }

    // 2. MÉTRICAS FINANCIERAS PRINCIPALES (Con Semestral y Anual)
    const metricasQuery = await client.query(`
      SELECT 
        COALESCE(SUM(total) FILTER (WHERE fecha::date = CURRENT_DATE AND estado = 'Completado'), 0) AS ventas_hoy,
        COALESCE(SUM(total) FILTER (WHERE fecha::date = CURRENT_DATE - INTERVAL '1 day' AND estado = 'Completado'), 0) AS ventas_ayer,
        COUNT(*) FILTER (WHERE fecha::date = CURRENT_DATE AND estado = 'Completado') AS transacciones_hoy,
        COALESCE(SUM(total) FILTER (WHERE fecha >= CURRENT_DATE - INTERVAL '7 days' AND estado = 'Completado'), 0) AS ventas_semana,
        COALESCE(SUM(total) FILTER (WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE) AND estado = 'Completado'), 0) AS ventas_mes,
        COALESCE(SUM(total) FILTER (WHERE fecha >= CURRENT_DATE - INTERVAL '6 months' AND estado = 'Completado'), 0) AS ventas_semestral,
        COALESCE(SUM(total) FILTER (WHERE date_trunc('year', fecha) = date_trunc('year', CURRENT_DATE) AND estado = 'Completado'), 0) AS ventas_anual
      FROM pedidos;
    `);

    // 3. DESGLOSE POR MÉTODO DE PAGO
    const pagosQuery = await client.query(`
      SELECT 
        COALESCE(LOWER(metodo_pago), 'efectivo') as metodo, 
        SUM(total) as total
      FROM pedidos
      WHERE estado = 'Completado' AND fecha::date = CURRENT_DATE
      GROUP BY LOWER(metodo_pago);
    `);

    // 4. CURVA DE INGRESOS POR HORA
    const horasQuery = await client.query(`
      SELECT 
        EXTRACT(HOUR FROM fecha) as hora, 
        SUM(total) as monto
      FROM pedidos
      WHERE estado = 'Completado' AND fecha::date = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM fecha)
      ORDER BY hora;
    `);

    // 5. PRODUCTOS MÁS VENDIDOS DEL DÍA
    const productosQuery = await client.query(`
      SELECT items FROM pedidos 
      WHERE estado = 'Completado' AND fecha::date = CURRENT_DATE;
    `);

    client.release();

    // Procesamiento de JSONB de productos
    const conteoProd: Record<string, number> = {};
    productosQuery.rows.forEach(p => {
      if (p.items) {
        try {
          const arr = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
          if (Array.isArray(arr)) {
            arr.forEach((it: any) => {
              if (it.nombre) {
                conteoProd[it.nombre] = (conteoProd[it.nombre] || 0) + Number(it.cantidad || 1);
              }
            });
          }
        } catch (e) {}
      }
    });

    const topProductos = Object.entries(conteoProd)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const stats = metricasQuery.rows[0];
    const ventasHoy = Number(stats.ventas_hoy) || 0;
    const ventasAyer = Number(stats.ventas_ayer) || 0;
    const transaccionesHoy = Number(stats.transacciones_hoy) || 0;

    let crecimiento = 0;
    if (ventasAyer > 0) {
      crecimiento = ((ventasHoy - ventasAyer) / ventasAyer) * 100;
    }

    const arregloHoras = Array(24).fill(0);
    horasQuery.rows.forEach((r: any) => {
      arregloHoras[Number(r.hora)] = Number(r.monto);
    });

    const metodosDesglose: Record<string, number> = {};
    pagosQuery.rows.forEach((r: any) => {
      metodosDesglose[r.metodo] = Number(r.total);
    });

    return NextResponse.json({
      finanzas: {
        ventasHoy,
        ventasAyer,
        crecimientoHoy: Number(crecimiento.toFixed(1)),
        transaccionesHoy,
        ticketPromedio: transaccionesHoy > 0 ? Math.round(ventasHoy / transaccionesHoy) : 0,
        ventasSemana: Number(stats.ventas_semana) || 0,
        ventasMes: Number(stats.ventas_mes) || 0,
        ventasSemestral: Number(stats.ventas_semestral) || 0,
        ventasAnual: Number(stats.ventas_anual) || 0,
        metaDiaria 
      },
      pagos: metodosDesglose,
      graficos: { ventasPorHora: arregloHoras },
      operacion: { topProductos }
    });

  } catch (err) {
    if (client) client.release();
    console.error("Error SQL en /api/dashboard/resumen:", err);
    return NextResponse.json({ error: 'Error al calcular analíticas' }, { status: 500 });
  }
}

// 6. FUNCIÓN POST PARA GUARDAR LA META EN POSTGRESQL
export async function POST(req: Request) {
  let client;
  try {
    const body = await req.json();
    const { nuevaMeta } = body;

    if (!nuevaMeta) {
      return NextResponse.json({ error: 'Falta la meta' }, { status: 400 });
    }

    client = await pool.connect();
    // Actualizamos la meta en la tabla de configuración
    await client.query('UPDATE configuracion SET meta_diaria = $1', [nuevaMeta]);
    client.release();

    return NextResponse.json({ success: true, meta: nuevaMeta });
  } catch (error) {
    if (client) client.release();
    console.error("Error guardando meta en BD:", error);
    return NextResponse.json({ error: 'Error al guardar la meta' }, { status: 500 });
  }
}