'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import VentasLineChart from './VentasLineChart';

interface Movimiento {
  id: number;
  producto_id: number;
  nombre_producto?: string;
  codigo_producto?: string;
  transaccion_id?: string | null;
  codigo_seguimiento?: string | null;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  motivo_tipo: string;
  motivo: string;
  precio_unitario: number;
}

interface ProductoCatalogo {
  id: number;
  codigo: string | null;
  nombre: string;
  stock_actual: number;
}

interface VentaAgrupada {
  clave: string;
  codigo: string;
  fecha: string;
  motivo: string;
  movimientos: Movimiento[];
  unidades: number;
  total: number;
}

interface ReportesInventarioViewProps {
  modo: 'diario' | 'mensual';
}

const fechaLocal = (fecha: string | Date) => {
  const date = new Date(fecha);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const hoy = () => fechaLocal(new Date());
const mesActual = () => hoy().slice(0, 7);
const formatoMoneda = (valor: number) => `$${valor.toLocaleString('es-CO')} COP`;
const formatoFecha = (fecha: string) => new Date(fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const esVenta = (movimiento: Movimiento) => movimiento.tipo === 'SALIDA' && movimiento.motivo_tipo === 'VENTA';

function agruparVentas(movimientos: Movimiento[]): VentaAgrupada[] {
  const grupos = new Map<string, Movimiento[]>();
  movimientos.filter(esVenta).forEach((movimiento) => {
    const clave = movimiento.transaccion_id || movimiento.codigo_seguimiento || `movimiento-${movimiento.id}`;
    const grupo = grupos.get(clave) || [];
    grupo.push(movimiento);
    grupos.set(clave, grupo);
  });

  return Array.from(grupos.entries()).map(([clave, lineas]) => ({
    clave,
    codigo: lineas[0].codigo_seguimiento || `WR-${lineas[0].id}`,
    fecha: lineas[0].fecha,
    motivo: lineas[0].motivo || 'Venta',
    movimientos: lineas,
    unidades: lineas.reduce((total, linea) => total + Number(linea.cantidad), 0),
    total: lineas.reduce((total, linea) => total + Number(linea.cantidad) * Number(linea.precio_unitario), 0),
  })).sort((primera, segunda) => segunda.fecha.localeCompare(primera.fecha));
}

function VentaDetalle({ venta }: { venta: VentaAgrupada }) {
  return (
    <details className="group">
      <summary aria-label={`Ver detalle de la venta ${venta.codigo}`} title="Ver productos de la venta" className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-blue-100 text-blue-800 hover:bg-blue-50">
        <MagnifyingGlassIcon className="h-4 w-4" />
      </summary>
      <div className="mt-2 min-w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-xs font-bold text-slate-700">Productos de la venta</p>
        <ul className="space-y-2">
          {venta.movimientos.map((movimiento) => (
            <li key={movimiento.id} className="flex justify-between gap-4 text-xs">
              <span className="text-slate-600">{movimiento.nombre_producto || `Producto ${movimiento.producto_id}`}</span>
              <strong className="whitespace-nowrap text-slate-900">{movimiento.cantidad} uds.</strong>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export default function ReportesInventarioView({ modo }: ReportesInventarioViewProps) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [fecha, setFecha] = useState(hoy);
  const [mes, setMes] = useState(mesActual);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/inventario', { cache: 'no-store' }),
      fetch('/api/productos', { cache: 'no-store' }),
    ])
      .then(async ([respuestaMovimientos, respuestaProductos]) => {
        const [datosMovimientos, datosProductos] = await Promise.all([
          respuestaMovimientos.json(),
          respuestaProductos.json(),
        ]);
        if (!respuestaMovimientos.ok) throw new Error(datosMovimientos.error || 'No se pudieron cargar las ventas.');
        if (!respuestaProductos.ok) throw new Error(datosProductos.error || 'No se pudo cargar el catálogo de productos.');
        setMovimientos(Array.isArray(datosMovimientos) ? datosMovimientos : []);
        setProductos(Array.isArray(datosProductos) ? datosProductos : []);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Error al cargar los reportes.'))
      .finally(() => setCargando(false));
  }, []);

  const ventasPeriodo = movimientos.filter((movimiento) => {
    if (!esVenta(movimiento)) return false;
    const claveFecha = fechaLocal(movimiento.fecha);
    return modo === 'diario' ? claveFecha === fecha : claveFecha.startsWith(mes);
  });
  const ventasAgrupadas = agruparVentas(ventasPeriodo);
  const totalPeriodo = ventasAgrupadas.reduce((total, venta) => total + venta.total, 0);
  const unidadesPeriodo = ventasAgrupadas.reduce((total, venta) => total + venta.unidades, 0);
  const diasConVentas = new Set(ventasAgrupadas.map((venta) => fechaLocal(venta.fecha))).size;

  const productosVendidos = new Map<string, { codigo: string; nombre: string; unidades: number }>();
  productos.forEach((producto) => {
    const codigo = producto.codigo || String(producto.id);
    productosVendidos.set(codigo, {
      codigo,
      nombre: producto.nombre,
      unidades: 0,
    });
  });
  ventasPeriodo.forEach((movimiento) => {
    const codigo = movimiento.codigo_producto || String(movimiento.producto_id);
    const producto = productosVendidos.get(codigo) || {
      codigo,
      nombre: movimiento.nombre_producto || `Producto ${codigo}`,
      unidades: 0,
    };
    producto.unidades += Number(movimiento.cantidad);
    productosVendidos.set(codigo, producto);
  });
  const rankingProductos = Array.from(productosVendidos.values()).sort((primero, segundo) => segundo.unidades - primero.unidades);
  const productoMasVendido = rankingProductos[0]?.unidades ? rankingProductos[0] : undefined;
  const productoMenosVendido = rankingProductos.at(-1);
  const productosSinVentas = rankingProductos
    .filter((producto) => producto.unidades === 0)
    .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es', { sensitivity: 'base' }));

  const [anio, numeroMes] = mes.split('-').map(Number);
  const ultimoDiaMes = new Date(anio, numeroMes, 0).getDate();
  const diasDelMes = modo !== 'mensual'
    ? 0
    : mes === mesActual()
      ? Number(hoy().slice(-2))
      : ultimoDiaMes;
  const ventasDiarias = Array.from({ length: diasDelMes }, (_, indice) => {
    const dia = String(indice + 1).padStart(2, '0');
    const clave = `${mes}-${dia}`;
    const total = ventasPeriodo
      .filter((movimiento) => fechaLocal(movimiento.fecha) === clave)
      .reduce((suma, movimiento) => suma + Number(movimiento.cantidad) * Number(movimiento.precio_unitario), 0);
    return { clave, dia: indice + 1, total };
  });

  const obtenerAnterior = (claveMes: string) => {
    const anterior = new Date(`${claveMes}-01T12:00:00`);
    anterior.setMonth(anterior.getMonth() - 1);
    return `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, '0')}`;
  };
  const mesAnterior = modo === 'mensual' ? obtenerAnterior(mes) : '';
  const unidadesMesAnterior = new Map<string, number>();
  if (modo === 'mensual') {
    movimientos.filter((movimiento) => esVenta(movimiento) && fechaLocal(movimiento.fecha).startsWith(mesAnterior))
      .forEach((movimiento) => {
        const codigo = movimiento.codigo_producto || String(movimiento.producto_id);
        unidadesMesAnterior.set(codigo, (unidadesMesAnterior.get(codigo) || 0) + Number(movimiento.cantidad));
      });
  }
  const crecimiento = rankingProductos
    .map((producto) => ({
      ...producto,
      diferencia: producto.unidades - (unidadesMesAnterior.get(producto.codigo) || 0),
    }))
    .filter((producto) => producto.diferencia > 0)
    .sort((primero, segundo) => segundo.diferencia - primero.diferencia)[0];

  const ventasPorDia = new Map<string, Set<string>>();
  ventasAgrupadas.forEach((venta) => {
    const dia = fechaLocal(venta.fecha);
    const transacciones = ventasPorDia.get(dia) || new Set<string>();
    transacciones.add(venta.clave);
    ventasPorDia.set(dia, transacciones);
  });
  const maxComprasDia = Math.max(...Array.from(ventasPorDia.values()).map((transacciones) => transacciones.size), 0);
  const diasPico = Array.from(ventasPorDia.entries())
    .filter(([, transacciones]) => transacciones.size === maxComprasDia && maxComprasDia > 0)
    .map(([dia]) => Number(dia.slice(-2)));

  return (
    <section className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between print:hidden">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Wash Riders · Ventas</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{modo === 'diario' ? 'Reporte de ventas' : 'Reporte mensual'}</h1>
            <p className="mt-2 text-sm text-slate-500">{modo === 'diario' ? 'Consulta ventas y productos por fecha.' : 'Analiza ventas, productos y actividad del mes.'}</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 self-start rounded-lg bg-[#1f5a8a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#174a74] sm:self-auto">
            <PrinterIcon className="h-4 w-4" /> {modo === 'mensual' ? 'Descargar PDF' : 'Imprimir reporte'}
          </button>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
          {modo === 'diario' ? (
            <label className="text-xs font-bold uppercase text-slate-600">
              Fecha de consulta
              <input type="date" max={hoy()} value={fecha} onChange={(event) => setFecha(event.target.value)} className="mt-2 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100" />
            </label>
          ) : (
            <label className="text-xs font-bold uppercase text-slate-600">
              Mes del informe
              <input type="month" max={mesActual()} value={mes} onChange={(event) => setMes(event.target.value)} className="mt-2 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100" />
            </label>
          )}
          <CalendarDaysIcon className="mb-2 h-5 w-5 text-blue-700" />
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {cargando && <p role="status" className="text-sm text-slate-500 print:hidden">Cargando movimientos...</p>}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Total vendido</p><p className="mt-2 text-2xl font-black text-blue-900">{formatoMoneda(totalPeriodo)}</p><p className="mt-1 text-xs capitalize text-slate-500">{modo === 'diario' ? new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { dateStyle: 'long' }) : new Date(`${mes}-01T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p></article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Ventas registradas</p><p className="mt-2 text-2xl font-black">{ventasAgrupadas.length}</p><p className="mt-1 text-xs text-slate-500">Transacciones del periodo</p></article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Unidades vendidas</p><p className="mt-2 text-2xl font-black">{unidadesPeriodo}</p><p className="mt-1 text-xs text-slate-500">En {ventasAgrupadas.length} operaciones</p></article>
          {modo === 'mensual' && <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Días con actividad</p><p className="mt-2 text-2xl font-black">{diasConVentas}</p><p className="mt-1 text-xs text-slate-500">Días con al menos una venta</p></article>}
          {modo === 'mensual' && <article className="rounded-lg border border-amber-200 bg-amber-50/60 p-5"><p className="text-xs font-bold uppercase text-amber-800">Productos sin ventas</p><p className="mt-2 text-2xl font-black text-amber-900">{productosSinVentas.length}</p><p className="mt-1 text-xs text-amber-800">Del catálogo activo en el periodo</p></article>}
        </section>

        {modo === 'mensual' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div><h2 className="font-bold">Evolución diaria</h2><p className="mt-1 text-xs capitalize text-slate-500">Ingresos por día · {new Date(`${mes}-01T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p></div>
              <ChartBarIcon className="h-5 w-5 text-blue-700" />
            </div>
            <div className="mt-4">
              <VentasLineChart
                descripcion={`Ingresos por día del mes ${mes}`}
                puntos={ventasDiarias.map((dia) => ({
                  etiqueta: String(dia.dia),
                  valor: dia.total,
                  detalle: `${dia.clave}: ${formatoMoneda(dia.total)}`,
                }))}
              />
            </div>
          </section>
        )}

        {modo === 'mensual' && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Producto más vendido</p><p className="mt-2 font-bold">{productoMasVendido?.nombre || 'Sin ventas'}</p><p className="mt-1 text-xs text-slate-500">{productoMasVendido ? `${productoMasVendido.codigo} · ${productoMasVendido.unidades} unidades` : '—'}</p></article>
            <article className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Producto menos vendido</p><p className="mt-2 font-bold">{productoMenosVendido?.nombre || 'Sin ventas'}</p><p className="mt-1 text-xs text-slate-500">{productoMenosVendido ? `${productoMenosVendido.codigo} · ${productoMenosVendido.unidades} unidades` : '—'}</p></article>
            <article className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Días con más ventas</p><p className="mt-2 font-bold">{diasPico.length ? diasPico.join(', ') : '—'}</p><p className="mt-1 text-xs text-slate-500">{maxComprasDia ? `${maxComprasDia} compras en cada día` : 'Sin ventas'}</p></article>
            <article className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Producto en crecimiento</p><p className="mt-2 font-bold">{crecimiento?.nombre || 'Sin crecimiento'}</p><p className="mt-1 text-xs text-slate-500">{crecimiento ? `+${crecimiento.diferencia} unidades vs. mes anterior` : 'Comparado con el mes anterior'}</p></article>
          </section>
        )}

        {modo === 'mensual' && (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Sin movimiento de venta</p>
                <h2 className="mt-1 font-bold">Productos no vendidos este mes</h2>
              </div>
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">{productosSinVentas.length}</span>
            </header>
            {productosSinVentas.length ? (
              <div className="max-h-80 overflow-y-auto">
                <ul className="divide-y divide-slate-100">
                  {productosSinVentas.map((producto) => (
                    <li key={producto.codigo} className="flex items-center justify-between gap-4 px-5 py-3">
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-semibold text-slate-800">{producto.nombre}</strong>
                        <span className="font-mono text-xs text-slate-500">{producto.codigo}</span>
                      </span>
                      <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">0 vendidos</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Todos los productos del catálogo tuvieron ventas este mes.</p>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{modo === 'diario' ? 'Detalle diario' : 'Desglose mensual'}</p><h2 className="mt-1 font-bold">{modo === 'diario' ? 'Ventas de la fecha' : 'Registro de ventas'}</h2></div>
            <span className="text-xs text-slate-500">{ventasAgrupadas.length} {ventasAgrupadas.length === 1 ? 'compra' : 'compras'}</span>
          </header>
          {modo === 'diario' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Código de seguimiento</th><th className="px-4 py-3">Fecha y hora</th><th className="px-4 py-3">Productos</th><th className="px-4 py-3">Unidades</th><th className="px-4 py-3">Motivo</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Detalle</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{ventasAgrupadas.map((venta) => <tr key={venta.clave}><td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800">{venta.codigo}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatoFecha(venta.fecha)}</td><td className="px-4 py-3">{venta.movimientos.length}</td><td className="px-4 py-3">{venta.unidades}</td><td className="px-4 py-3">{venta.motivo}</td><td className="px-4 py-3 text-right font-semibold">{formatoMoneda(venta.total)}</td><td className="px-4 py-3 text-right"><VentaDetalle venta={venta} /></td></tr>)}{!cargando && ventasAgrupadas.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No hay ventas en esta fecha.</td></tr>}</tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Código de seguimiento</th><th className="px-4 py-3">Fecha y hora</th><th className="px-4 py-3">Productos</th><th className="px-4 py-3">Unidades</th><th className="px-4 py-3">Motivo</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Detalle</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{ventasAgrupadas.map((venta) => <tr key={venta.clave}><td className="px-4 py-3 font-mono text-xs font-semibold text-blue-800">{venta.codigo}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatoFecha(venta.fecha)}</td><td className="px-4 py-3">{venta.movimientos.length}</td><td className="px-4 py-3">{venta.unidades}</td><td className="px-4 py-3">{venta.motivo}</td><td className="px-4 py-3 text-right font-semibold">{formatoMoneda(venta.total)}</td><td className="px-4 py-3 text-right"><VentaDetalle venta={venta} /></td></tr>)}{!cargando && ventasAgrupadas.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No hay ventas para este mes.</td></tr>}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}