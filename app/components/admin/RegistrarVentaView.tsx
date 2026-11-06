'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Producto {
  id: number;
  codigo: string | null;
  nombre: string;
  categoria: string;
  precio: number;
  stock_actual: number;
}

interface ItemCarrito {
  producto_id: number;
  cantidad: number;
}

type TipoSalida = 'VENTA' | 'USO_INTERNO' | 'OTRO';

const formatoMoneda = (valor: number) => `$${valor.toLocaleString('es-CO')} COP`;

export default function RegistrarVentaView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [productoId, setProductoId] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState(1);
  const [tipo, setTipo] = useState<TipoSalida>('VENTA');
  const [detalle, setDetalle] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const response = await fetch('/api/productos', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catálogo.');
      setProductos(Array.isArray(data) ? data : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al cargar productos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarProductos();
  }, []);

  const productoSeleccionado = productos.find((producto) => producto.id === Number(productoId));
  const cantidadEnCarrito = carrito.find((item) => item.producto_id === productoSeleccionado?.id)?.cantidad || 0;
  const disponibleParaAgregar = productoSeleccionado
    ? Number(productoSeleccionado.stock_actual) - cantidadEnCarrito
    : 0;
  const productosFiltrados = productos.filter((producto) =>
    `${producto.codigo || ''} ${producto.nombre} ${producto.categoria || ''}`
      .toLocaleLowerCase()
      .includes(busqueda.trim().toLocaleLowerCase())
  );
  const total = carrito.reduce((suma, item) => {
    const producto = productos.find((registro) => registro.id === item.producto_id);
    return suma + (producto ? Number(producto.precio) * item.cantidad : 0);
  }, 0);
  const totalUnidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  const agregarProducto = () => {
    if (!productoSeleccionado || !Number.isInteger(cantidad) || cantidad < 1) return;
    if (cantidad > disponibleParaAgregar) {
      setError(`Solo hay ${disponibleParaAgregar} unidades disponibles para agregar.`);
      return;
    }
    setCarrito((actual) => {
      const existente = actual.find((item) => item.producto_id === productoSeleccionado.id);
      if (existente) {
        return actual.map((item) => item.producto_id === productoSeleccionado.id
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item);
      }
      return [...actual, { producto_id: productoSeleccionado.id, cantidad }];
    });
    setProductoId('');
    setCantidad(1);
    setError('');
  };

  const actualizarCantidad = (productoIdActual: number, nuevaCantidad: number) => {
    const producto = productos.find((registro) => registro.id === productoIdActual);
    if (!producto || !Number.isInteger(nuevaCantidad) || nuevaCantidad < 1 || nuevaCantidad > Number(producto.stock_actual)) return;
    setCarrito((actual) => actual.map((item) => item.producto_id === productoIdActual
      ? { ...item, cantidad: nuevaCantidad }
      : item));
  };

  const registrarSalida = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setConfirmacion('');
    if (!carrito.length) {
      setError('Agrega por lo menos un producto.');
      return;
    }
    if (tipo === 'OTRO' && !detalle.trim()) {
      setError('Escribe el motivo de la salida.');
      return;
    }

    setProcesando(true);
    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: carrito, tipo, motivo: detalle.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar la salida.');

      setConfirmacion(data.codigo_seguimiento
        ? `Venta registrada. Código: ${data.codigo_seguimiento}`
        : 'Salida registrada y existencias actualizadas.');
      setCarrito([]);
      setBusqueda('');
      setDetalle('');
      await cargarProductos();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error al registrar la salida.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#030303] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Operación de inventario</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
              <ShoppingCartIcon className="h-8 w-8 text-[#E50914]" /> Registrar venta o salida
            </h1>
            <p className="mt-2 text-sm text-slate-400">Agrega varios productos y registra todo en un solo movimiento.</p>
          </div>
          <button
            type="button"
            onClick={() => void cargarProductos()}
            disabled={cargando || procesando}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50 sm:self-auto"
          >
            <ArrowPathIcon className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar stock
          </button>
        </header>

        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</p>}
        {confirmacion && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-300">{confirmacion}</p>}

        <form onSubmit={registrarSalida} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="space-y-5 rounded-xl border border-white/10 bg-[#0f0f0f] p-5 md:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase text-slate-400 sm:col-span-2">
                Buscar producto
                <span className="relative mt-2 block">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Nombre, código o sección"
                    className="w-full rounded-lg border border-white/10 bg-black/50 py-2.5 pl-10 pr-3 text-sm text-white normal-case outline-none focus:border-[#E50914]"
                  />
                </span>
              </label>
              <label className="block text-xs font-bold uppercase text-slate-400">
                Producto
                <select
                  required
                  value={productoId}
                  onChange={(event) => setProductoId(event.target.value ? Number(event.target.value) : '')}
                  disabled={cargando}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white normal-case outline-none focus:border-[#E50914]"
                >
                  <option value="">{cargando ? 'Cargando catálogo...' : 'Seleccionar producto'}</option>
                  {productosFiltrados.map((producto) => {
                    const enCarrito = carrito.find((item) => item.producto_id === producto.id)?.cantidad || 0;
                    const disponible = Number(producto.stock_actual) - enCarrito;
                    return (
                      <option key={producto.id} value={producto.id} disabled={disponible < 1}>
                        {producto.categoria || 'General'} · {producto.nombre} · {disponible} disponibles
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="block text-xs font-bold uppercase text-slate-400">
                Cantidad
                <input
                  type="number"
                  min="1"
                  max={disponibleParaAgregar || undefined}
                  value={cantidad}
                  onChange={(event) => setCantidad(Number(event.target.value))}
                  disabled={!productoSeleccionado || disponibleParaAgregar < 1}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#E50914]"
                />
              </label>
            </div>

            {productoSeleccionado && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3 text-sm">
                <span className="text-slate-300">{productoSeleccionado.nombre} <span className="text-slate-500">({productoSeleccionado.codigo || 'Sin código'})</span></span>
                <span className="font-bold text-emerald-300">{disponibleParaAgregar} disponibles · {formatoMoneda(Number(productoSeleccionado.precio))}</span>
              </div>
            )}

            <button
              type="button"
              onClick={agregarProducto}
              disabled={!productoSeleccionado || cantidad < 1 || cantidad > disponibleParaAgregar}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusIcon className="h-4 w-4" /> Agregar al carrito
            </button>

            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-black/40 text-xs uppercase text-slate-400">
                  <tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Cantidad</th><th className="px-4 py-3 text-right">Subtotal</th><th className="px-4 py-3" /></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {carrito.map((item) => {
                    const producto = productos.find((registro) => registro.id === item.producto_id);
                    if (!producto) return null;
                    return (
                      <tr key={item.producto_id}>
                        <td className="px-4 py-3">
                          <span className="block font-semibold">{producto.nombre}</span>
                          <span className="text-xs text-slate-500">{producto.categoria || 'General'} · {producto.codigo || 'Sin código'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            max={producto.stock_actual}
                            value={item.cantidad}
                            aria-label={`Cantidad de ${producto.nombre}`}
                            onChange={(event) => actualizarCantidad(item.producto_id, Number(event.target.value))}
                            className="w-20 rounded-md border border-white/10 bg-black/50 px-2 py-1.5 text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatoMoneda(Number(producto.precio) * item.cantidad)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setCarrito((actual) => actual.filter((linea) => linea.producto_id !== item.producto_id))}
                            aria-label={`Quitar ${producto.nombre}`}
                            title="Quitar producto"
                            className="rounded-md p-2 text-slate-400 hover:bg-red-950/40 hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {carrito.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">Todavía no agregas productos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase text-slate-400">
                Tipo de movimiento
                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as TipoSalida)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white normal-case outline-none focus:border-[#E50914]"
                >
                  <option value="VENTA">Venta</option>
                  <option value="USO_INTERNO">Uso interno</option>
                  <option value="OTRO">Otro motivo</option>
                </select>
              </label>
              {tipo === 'OTRO' && (
                <label className="block text-xs font-bold uppercase text-slate-400">
                  Detalle
                  <input
                    type="text"
                    maxLength={140}
                    required
                    value={detalle}
                    onChange={(event) => setDetalle(event.target.value)}
                    placeholder="Describe el motivo"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white normal-case outline-none focus:border-[#E50914]"
                  />
                </label>
              )}
            </div>
          </div>

          <aside className="space-y-4 rounded-xl border border-white/10 bg-[#0f0f0f] p-5 md:p-7">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <ArrowDownCircleIcon className="h-6 w-6 text-emerald-400" />
              <div>
                <h2 className="font-bold">Resumen de salida</h2>
                <p className="text-xs text-slate-400">{totalUnidades} unidades en {carrito.length} productos</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-3 py-2">
              <span className="text-sm text-slate-400">Total de la venta</span>
              <strong className="text-xl font-black text-emerald-300">{formatoMoneda(total)}</strong>
            </div>
            <p className="text-xs leading-5 text-slate-500">El stock se valida y actualiza en una sola transacción. Si una referencia no tiene unidades suficientes, no se registra ninguna línea.</p>
            <button
              type="submit"
              disabled={procesando || cargando || carrito.length === 0}
              className="w-full rounded-lg bg-[#E50914] px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando ? 'Registrando...' : tipo === 'VENTA' ? 'Confirmar venta' : 'Confirmar salida'}
            </button>
          </aside>
        </form>
      </div>
    </section>
  );
}