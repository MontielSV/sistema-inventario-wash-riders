'use client';
import { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
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

export default function DashboardView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarProductos = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await fetch('/api/productos', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar el inventario');
      setProductos(Array.isArray(data) ? data : []);
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        </div>

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