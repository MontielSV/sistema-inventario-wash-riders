'use client';
import { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import VentasLineChart from './VentasLineChart';

interface Producto {
  id: number;
  codigo: string | null;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

interface Movimiento {
  id: number;
  nombre_producto?: string;
  codigo_producto?: string;
  transaccion_id?: string | null;
  codigo_seguimiento?: string | null;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  motivo_tipo: string;
  precio_unitario: number;
}

const fechaLocalClave = (fecha: Date) => {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

interface DashboardViewProps {
  onNavigate: (vista: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarProductos = async () => {
    setCargando(true);
    setError('');
    try {
      const [respuestaProductos, respuestaMovimientos] = await Promise.all([
        fetch('/api/productos', { cache: 'no-store' }),
        fetch('/api/inventario', { cache: 'no-store' }),
      ]);
      const [datosProductos, datosMovimientos] = await Promise.all([
        respuestaProductos.json(),
        respuestaMovimientos.json(),
      ]);
      if (!respuestaProductos.ok) throw new Error(datosProductos.error || 'No se pudo cargar el inventario');
      if (!respuestaMovimientos.ok) throw new Error(datosMovimientos.error || 'No se pudo cargar el historial de ventas');
      setProductos(Array.isArray(datosProductos) ? datosProductos : []);
      setMovimientos(Array.isArray(datosMovimientos) ? datosMovimientos : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al cargar el inventario');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarProductos();
  }, []);

  const unidades = productos.reduce((total, producto) => total + Number(producto.stock_actual), 0);
  const stockBajo = productos.filter(
    (producto) => Number(producto.stock_actual) <= Number(producto.stock_minimo)
  );
  const fechaHoy = fechaLocalClave(new Date());
  const ventasHoy = movimientos.filter(
    (movimiento) => movimiento.tipo === 'SALIDA' &&
      movimiento.motivo_tipo === 'VENTA' &&
      fechaLocalClave(new Date(movimiento.fecha)) === fechaHoy
  );
  const ingresosHoy = ventasHoy.reduce(
    (total, movimiento) => total + Number(movimiento.cantidad) * Number(movimiento.precio_unitario),
    0
  );
  const productosVendidosHoy = ventasHoy.reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);
  const conteoPorProducto = new Map<string, { nombre: string; codigo: string; cantidad: number }>();
  ventasHoy.forEach((movimiento) => {
    const codigo = movimiento.codigo_producto || String(movimiento.id);
    const actual = conteoPorProducto.get(codigo);
    if (actual) {
      actual.cantidad += Number(movimiento.cantidad);
    } else {
      conteoPorProducto.set(codigo, {
        nombre: movimiento.nombre_producto || `Producto ${codigo}`,
        codigo,
        cantidad: Number(movimiento.cantidad),
      });
    }
  });
  const productosMasVendidos = Array.from(conteoPorProducto.values())
    .sort((primero, segundo) => segundo.cantidad - primero.cantidad)
    .slice(0, 5);
  const productoMasVendido = productosMasVendidos[0];
  const ahora = new Date();
  const mesActual = fechaHoy.slice(0, 7);
  const diasEnMes = ahora.getDate();
  const ventasDelMes = movimientos.filter((movimiento) =>
    movimiento.tipo === 'SALIDA' &&
    movimiento.motivo_tipo === 'VENTA' &&
    fechaLocalClave(new Date(movimiento.fecha)).startsWith(mesActual)
  );
  const ventasDiarias = Array.from({ length: diasEnMes }, (_, indice) => {
    const dia = String(indice + 1).padStart(2, '0');
    const clave = `${mesActual}-${dia}`;
    const total = ventasDelMes
      .filter((movimiento) => fechaLocalClave(new Date(movimiento.fecha)) === clave)
      .reduce((suma, movimiento) => suma + Number(movimiento.cantidad) * Number(movimiento.precio_unitario), 0);
    return { clave, dia: indice + 1, total };
  });
  const ventasRecientesPorId = new Map<string, Movimiento[]>();
  movimientos.filter((movimiento) => movimiento.tipo === 'SALIDA' && movimiento.motivo_tipo === 'VENTA')
    .forEach((movimiento) => {
      const clave = movimiento.transaccion_id || movimiento.codigo_seguimiento || `venta-${movimiento.id}`;
      const lineas = ventasRecientesPorId.get(clave) || [];
      lineas.push(movimiento);
      ventasRecientesPorId.set(clave, lineas);
    });
  const ventasRecientes = Array.from(ventasRecientesPorId.entries())
    .map(([clave, lineas]) => ({
      clave,
      codigo: lineas[0].codigo_seguimiento || `WR-${lineas[0].id}`,
      fecha: lineas[0].fecha,
      productos: lineas.length,
      total: lineas.reduce((suma, linea) => suma + Number(linea.cantidad) * Number(linea.precio_unitario), 0),
    }))
    .sort((primera, segunda) => segunda.fecha.localeCompare(primera.fecha))
    .slice(0, 5);
  const formatoMoneda = (valor: number) => `$${valor.toLocaleString('es-CO')} COP`;

  return (
    <section className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Wash Riders</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Resumen de inventario</h1>
            <p className="mt-2 text-sm text-slate-400">Existencias actuales y productos que requieren reposición.</p>
          </div>
          <button
            type="button"
            onClick={() => void cargarProductos()}
            disabled={cargando}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-900 hover:bg-blue-50 disabled:opacity-50 sm:self-auto"
          >
            <ArrowPathIcon className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Productos registrados</span>
              <CubeIcon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-3xl font-black">{cargando ? '...' : productos.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Más vendido hoy</span>
              <ChartBarIcon className="h-5 w-5 text-blue-700" />
            </div>
            <p className="mt-3 truncate text-lg font-black text-slate-900">{cargando ? '...' : productoMasVendido?.nombre || 'Sin ventas'}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{productoMasVendido ? `${productoMasVendido.codigo} · ${productoMasVendido.cantidad} unidades` : 'Sin ventas registradas'}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Unidades disponibles</span>
              <Squares2X2Icon className="h-5 w-5 text-blue-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-blue-800">{cargando ? '...' : unidades}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Alertas de stock bajo</span>
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-amber-800">{cargando ? '...' : stockBajo.length}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Unidades vendidas hoy</span>
              <ChartBarIcon className="h-5 w-5 text-blue-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-blue-800">{cargando ? '...' : productosVendidosHoy}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">Ingresos de hoy</span>
              <BanknotesIcon className="h-5 w-5 text-blue-700" />
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">{cargando ? '...' : formatoMoneda(ingresosHoy)}</p>
          </article>
        </div>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold">Ventas del mes</h2>
                <p className="mt-1 text-xs capitalize text-slate-500">{new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(ahora)}</p>
              </div>
              <ChartBarIcon className="h-5 w-5 text-blue-700" />
            </div>
            <div className="mt-4">
              <VentasLineChart
                descripcion={`Ingresos por día de ${mesActual}`}
                puntos={ventasDiarias.map((dia) => ({
                  etiqueta: String(dia.dia),
                  valor: dia.total,
                  detalle: `${dia.clave}: ${formatoMoneda(dia.total)}`,
                }))}
              />
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold">Ventas recientes</h2>
                <p className="mt-1 text-xs text-slate-500">Últimas operaciones registradas</p>
              </div>
              <button type="button" onClick={() => onNavigate('historial')} className="text-xs font-semibold text-blue-800 hover:text-blue-950">Ver historial</button>
            </div>
            {ventasRecientes.length ? (
              <ol className="divide-y divide-slate-100">
                {ventasRecientes.map((venta) => (
                  <li key={venta.clave} className="py-3">
                    <span className="flex items-center justify-between gap-3">
                      <strong className="truncate font-mono text-xs text-blue-800">{venta.codigo}</strong>
                      <span className="whitespace-nowrap text-xs font-semibold text-slate-900">{formatoMoneda(venta.total)}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>{venta.productos} {venta.productos === 1 ? 'producto' : 'productos'}</span>
                      <time>{new Date(venta.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</time>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Aún no hay ventas registradas.</p>
            )}
          </article>
        </section>
      </div>
    </section>
  );
}