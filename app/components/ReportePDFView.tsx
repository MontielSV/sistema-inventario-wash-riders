'use client';
import { useEffect, useState } from 'react';
import { DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface Movimiento {
  id: number;
  producto_id: number;
  nombre_producto?: string;
  codigo_producto?: string;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  motivo_tipo: string;
  motivo: string;
  precio_unitario: number;
}

const MOTIVOS: Record<string, string> = {
  COMPRA: 'Compra',
  VENTA: 'Venta',
  USO_INTERNO: 'Uso interno',
  DANO: 'Daño',
  DONACION: 'Donación',
  AJUSTE: 'Ajuste',
  OTRO: 'Otro',
};

const formatCurrency = (value: number) => `$${value.toLocaleString('es-CO')}`;
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
const getLocalDateKey = (value: string) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const getTodayDateKey = () => getLocalDateKey(new Date().toISOString());

export default function ReportePDFView() {
  const [datos, setDatos] = useState<Movimiento[]>([]);
  const [mes, setMes] = useState(getTodayDateKey().slice(0, 7));
  const [desde, setDesde] = useState(getTodayDateKey);
  const [hasta, setHasta] = useState(getTodayDateKey);
  const [modo, setModo] = useState<'fecha' | 'mensual'>('mensual');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/inventario', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el historial');
        setDatos(Array.isArray(data) ? data : []);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Error al cargar el historial'))
      .finally(() => setCargando(false));
  }, []);

  const movimientosDelMes = datos.filter((item) => getLocalDateKey(item.fecha).slice(0, 7) === mes);
  const ventasPorFecha = desde <= hasta
    ? datos.filter((item) => {
      const fechaMovimiento = getLocalDateKey(item.fecha);
      return item.tipo === 'SALIDA' && item.motivo_tipo === 'VENTA' && fechaMovimiento >= desde && fechaMovimiento <= hasta;
    })
    : [];
  const movimientosReporte = modo === 'mensual' ? movimientosDelMes : ventasPorFecha;
  const ventasReporte = movimientosReporte.filter((item) => item.tipo === 'SALIDA' && item.motivo_tipo === 'VENTA');
  const ingresosVentas = ventasReporte.reduce(
    (total, item) => total + Number(item.cantidad) * Number(item.precio_unitario),
    0
  );
  const unidadesVendidas = ventasReporte.reduce((total, item) => total + Number(item.cantidad), 0);
  const entradas = movimientosDelMes
    .filter((item) => item.tipo === 'ENTRADA')
    .reduce((total, item) => total + Number(item.cantidad), 0);
  const salidas = movimientosDelMes
    .filter((item) => item.tipo === 'SALIDA')
    .reduce((total, item) => total + Number(item.cantidad), 0);

  const [anio, numeroMes] = mes.split('-').map(Number);
  const diasDelMes = new Date(anio, numeroMes, 0).getDate();
  const ventasDiarias = Array.from({ length: diasDelMes }, (_, index) => {
    const dia = String(index + 1).padStart(2, '0');
    const fechaDia = `${mes}-${dia}`;
    const total = movimientosDelMes
      .filter((item) => item.tipo === 'SALIDA' && item.motivo_tipo === 'VENTA' && getLocalDateKey(item.fecha) === fechaDia)
      .reduce((sum, item) => sum + Number(item.cantidad) * Number(item.precio_unitario), 0);
    return { dia: index + 1, total };
  });
  const maxVentaDiaria = Math.max(...ventasDiarias.map((item) => item.total), 0);

  return (
    <div className="min-h-screen bg-[#030303] p-4 text-white md:p-8 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 print:hidden lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black md:text-4xl">
              <DocumentArrowDownIcon className="h-8 w-8 text-[#E50914]" /> Reportes de inventario
            </h1>
            <p className="mt-1 text-sm text-slate-400">Ventas por periodo e informe mensual.</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-emerald-600 px-5 py-3 text-xs font-black uppercase text-white hover:bg-emerald-500 lg:self-auto"
          >
            <PrinterIcon className="h-4 w-4" /> Exportar PDF / Imprimir
          </button>
        </header>

        <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-white/10 bg-[#0f0f0f] p-1" role="group" aria-label="Tipo de reporte">
            <button
              type="button"
              aria-pressed={modo === 'fecha'}
              onClick={() => setModo('fecha')}
              className={`rounded-md px-4 py-2 text-sm font-bold ${modo === 'fecha' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Ventas por fecha
            </button>
            <button
              type="button"
              aria-pressed={modo === 'mensual'}
              onClick={() => setModo('mensual')}
              className={`rounded-md px-4 py-2 text-sm font-bold ${modo === 'mensual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Informe mensual
            </button>
          </div>

          {modo === 'mensual' ? (
            <label className="text-xs font-bold uppercase text-slate-400">
              Mes del informe
              <input
                type="month"
                value={mes}
                onChange={(event) => setMes(event.target.value)}
                className="ml-2 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
              />
            </label>
          ) : (
            <div className="flex flex-wrap gap-3">
              <label className="text-xs font-bold uppercase text-slate-400">
                Desde
                <input
                  type="date"
                  value={desde}
                  onChange={(event) => setDesde(event.target.value)}
                  className="ml-2 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
              </label>
              <label className="text-xs font-bold uppercase text-slate-400">
                Hasta
                <input
                  type="date"
                  value={hasta}
                  onChange={(event) => setHasta(event.target.value)}
                  className="ml-2 rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-white"
                />
              </label>
            </div>
          )}
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</p>}
        {cargando && <p className="text-sm text-slate-400 print:hidden">Cargando movimientos...</p>}
        {modo === 'fecha' && desde > hasta && (
          <p role="alert" className="text-sm text-amber-300 print:hidden">La fecha inicial debe ser anterior o igual a la fecha final.</p>
        )}

        <article className="space-y-6 rounded-xl bg-white p-5 text-black shadow-xl sm:p-8 print:rounded-none print:p-0 print:shadow-none">
          <header className="flex flex-col justify-between gap-4 border-b border-gray-300 pb-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black">WASH RIDERS</h2>
              <p className="mt-1 text-sm text-gray-600">
                {modo === 'mensual' ? `Informe mensual de inventario y ventas - ${mes}` : `Reporte de ventas - ${desde} a ${hasta}`}
              </p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p>Generado: {new Date().toLocaleDateString('es-CO')}</p>
              <p>Periodo: {modo === 'mensual' ? mes : `${desde} a ${hasta}`}</p>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-3 border-b border-gray-200 pb-5 sm:grid-cols-4">
            <div><p className="text-xs uppercase text-gray-500">Ventas</p><p className="mt-1 text-xl font-black">{ventasReporte.length}</p></div>
            <div><p className="text-xs uppercase text-gray-500">Unidades vendidas</p><p className="mt-1 text-xl font-black">{unidadesVendidas}</p></div>
            <div><p className="text-xs uppercase text-gray-500">Ingresos por ventas</p><p className="mt-1 text-xl font-black">{formatCurrency(ingresosVentas)}</p></div>
            {modo === 'mensual' && <div><p className="text-xs uppercase text-gray-500">Entradas / salidas</p><p className="mt-1 text-xl font-black">{entradas} / {salidas}</p></div>}
          </section>

          {modo === 'mensual' && (
            <section aria-label="Gráfica diaria de ingresos por ventas" className="space-y-3 border-b border-gray-200 pb-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold uppercase">Ingresos por ventas por día</h3>
                <p className="text-xs text-gray-500">Total diario en moneda local</p>
              </div>
              <div role="img" aria-label={`Gráfica de ventas del mes ${mes}`} className="flex h-44 items-end gap-1 overflow-x-auto border-b border-l border-gray-300 px-2">
                {ventasDiarias.map(({ dia, total }) => (
                  <div key={dia} className="flex h-full min-w-5 flex-1 flex-col items-center justify-end gap-1" title={`${dia}/${numeroMes}: ${formatCurrency(total)}`}>
                    <div className="w-full rounded-t-sm bg-emerald-600 print:bg-gray-700" style={{ height: total > 0 && maxVentaDiaria > 0 ? `${Math.max(4, total / maxVentaDiaria * 100)}%` : '0%' }} />
                    <span className="pb-1 text-[9px] text-gray-500">{dia}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b-2 border-black font-bold uppercase">
                  <th className="py-2 pr-3">Fecha y hora</th>
                  <th className="py-2 pr-3">Producto / código</th>
                  <th className="py-2 pr-3">Movimiento</th>
                  <th className="py-2 pr-3 text-right">Cantidad</th>
                  <th className="py-2 pr-3 text-right">Precio unitario</th>
                  <th className="py-2 pr-3 text-right">Total venta</th>
                  <th className="py-2">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movimientosReporte.map((item) => {
                  const esVenta = item.tipo === 'SALIDA' && item.motivo_tipo === 'VENTA';
                  return (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap py-2 pr-3 font-mono">{formatDateTime(item.fecha)}</td>
                      <td className="py-2 pr-3"><strong>{item.nombre_producto || `ID ${item.producto_id}`}</strong><br />{item.codigo_producto || '-'}</td>
                      <td className="whitespace-nowrap py-2 pr-3">{item.tipo} / {MOTIVOS[item.motivo_tipo] || 'Otro'}</td>
                      <td className="py-2 pr-3 text-right font-mono">{item.cantidad}</td>
                      <td className="py-2 pr-3 text-right font-mono">{formatCurrency(Number(item.precio_unitario))}</td>
                      <td className="py-2 pr-3 text-right font-mono">{esVenta ? formatCurrency(Number(item.cantidad) * Number(item.precio_unitario)) : '-'}</td>
                      <td className="py-2">{item.motivo || '-'}</td>
                    </tr>
                  );
                })}
                {!cargando && movimientosReporte.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-500">No hay movimientos para el periodo seleccionado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  );
}
