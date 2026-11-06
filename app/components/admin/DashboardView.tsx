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

interface Producto {
  id: number;
  codigo: string | null;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
}

interface Movimiento {
  id: number;
  nombre_producto?: string;
  codigo_producto?: string;
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

export default function DashboardView() {
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
  const ventasUltimosSieteDias = Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date();
    dia.setHours(0, 0, 0, 0);
    dia.setDate(dia.getDate() - (6 - indice));
    const clave = fechaLocalClave(dia);
    const ventas = movimientos.filter((movimiento) =>
      movimiento.tipo === 'SALIDA' &&
      movimiento.motivo_tipo === 'VENTA' &&
      fechaLocalClave(new Date(movimiento.fecha)) === clave
    );
    return {
      clave,
      etiqueta: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(dia).replace('.', ''),
      total: ventas.reduce((suma, movimiento) => suma + Number(movimiento.cantidad) * Number(movimiento.precio_unitario), 0),
    };
  });
  const mayorVentaDiaria = Math.max(...ventasUltimosSieteDias.map((dia) => dia.total), 0);
  const formatoMoneda = (valor: number) => `$${valor.toLocaleString('es-CO')} COP`;

  return (
    <section className="min-h-screen bg-[#030303] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Wash Riders</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Resumen de inventario</h1>
            <p className="mt-2 text-sm text-slate-400">Existencias actuales y productos que requieren reposición.</p>
          </div>
          <button
            type="button"
            onClick={() => void cargarProductos()}
            disabled={cargando}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50 sm:self-auto"
          >
            <ArrowPathIcon className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Productos registrados</span>
              <CubeIcon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-3xl font-black">{cargando ? '...' : productos.length}</p>
          </article>
          <article className="rounded-xl border border-emerald-500/20 bg-[#0f0f0f] p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Unidades disponibles</span>
              <Squares2X2Icon className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-400">{cargando ? '...' : unidades}</p>
          </article>
          <article className="rounded-xl border border-amber-500/25 bg-[#0f0f0f] p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Alertas de stock bajo</span>
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-amber-400">{cargando ? '...' : stockBajo.length}</p>
          </article>
          <article className="rounded-xl border border-sky-500/20 bg-[#0f0f0f] p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Unidades vendidas hoy</span>
              <ChartBarIcon className="h-5 w-5 text-sky-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-sky-300">{cargando ? '...' : productosVendidosHoy}</p>
          </article>
          <article className="rounded-xl border border-emerald-500/20 bg-[#0f0f0f] p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Ingresos de hoy</span>
              <BanknotesIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-2xl font-black text-emerald-300">{cargando ? '...' : formatoMoneda(ingresosHoy)}</p>
          </article>
        </div>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
          <article className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold">Ventas últimos 7 días</h2>
                <p className="mt-1 text-xs text-slate-400">Ingresos diarios registrados</p>
              </div>
              <ChartBarIcon className="h-5 w-5 text-sky-400" />
            </div>
            <div className="mt-5 grid h-44 grid-cols-7 items-end gap-2" role="img" aria-label="Gráfico de ingresos diarios de los últimos siete días">
              {ventasUltimosSieteDias.map((dia) => (
                <div key={dia.clave} className="flex h-full min-w-0 flex-col items-center justify-end gap-2" title={`${dia.clave}: ${formatoMoneda(dia.total)}`}>
                  <div className="flex h-full w-full items-end rounded-t-sm bg-white/[0.03]">
                    <div
                      className="w-full rounded-t-sm bg-sky-500 transition-[height]"
                      style={{ height: dia.total > 0 && mayorVentaDiaria > 0 ? `${Math.max(5, (dia.total / mayorVentaDiaria) * 100)}%` : '0%' }}
                    />
                  </div>
                  <span className="text-[10px] capitalize text-slate-500">{dia.etiqueta}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold">Más vendidos hoy</h2>
              <p className="mt-1 text-xs text-slate-400">{ventasHoy.length} líneas · {productosVendidosHoy} unidades</p>
            </div>
            {productosMasVendidos.length ? (
              <ol className="divide-y divide-white/5">
                {productosMasVendidos.map((producto, indice) => (
                  <li key={producto.codigo} className="flex items-center gap-3 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-xs font-bold text-slate-300">{indice + 1}</span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">{producto.nombre}</strong>
                      <small className="text-xs text-slate-500">{producto.codigo}</small>
                    </span>
                    <span className="whitespace-nowrap text-sm font-bold text-sky-300">{producto.cantidad} uds.</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Aún no hay ventas registradas hoy.</p>
            )}
          </article>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <h2 className="text-lg font-bold">Productos para reponer</h2>
              <p className="mt-1 text-xs text-slate-400">Stock actual igual o inferior al mínimo definido.</p>
            </div>
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-400" />
          </div>
          {cargando ? (
            <p className="p-8 text-center text-sm text-slate-400">Consultando existencias...</p>
          ) : stockBajo.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No hay productos con stock bajo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/30 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Código</th>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">Categoría</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Mínimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stockBajo.map((producto) => (
                    <tr key={producto.id}>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-400">
                        {producto.codigo || `ID-${producto.id}`}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-semibold">{producto.nombre}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-400">{producto.categoria || 'General'}</td>
                      <td className="px-5 py-3 text-right font-bold text-amber-300">{producto.stock_actual}</td>
                      <td className="px-5 py-3 text-right text-slate-400">{producto.stock_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}