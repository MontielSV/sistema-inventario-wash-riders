'use client';
import { useState, useEffect } from 'react';
import { 
  ArrowsRightLeftIcon, 
  ArrowDownCircleIcon, 
  ArrowUpCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
}

interface Movimiento {
  id: number;
  producto_id: number;
  nombre_producto?: string;
  codigo_producto?: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'VENTA';
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

const getLocalDateTimeInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const toLocalDateTimeInput = (value: string) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function InventarioView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SALIDA'>('TODOS');

  // Formulario
  const [movimientoEditando, setMovimientoEditando] = useState<number | null>(null);
  const [productoId, setProductoId] = useState<number | ''>('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [motivoTipo, setMotivoTipo] = useState('COMPRA');
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState(getLocalDateTimeInput);
  const [procesando, setProcesando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resProd, resMov] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/inventario')
      ]);

      if (resProd.ok) {
        const dataP = await resProd.json();
        setProductos(Array.isArray(dataP) ? dataP : []);
      }
      if (resMov.ok) {
        const dataM = await resMov.json();
        setMovimientos(Array.isArray(dataM) ? dataM : []);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId) {
      alert('Selecciona un producto');
      return;
    }

    setProcesando(true);
    try {
      const res = await fetch('/api/inventario', {
        method: movimientoEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(movimientoEditando ? { id: movimientoEditando } : {}),
          producto_id: Number(productoId),
          tipo,
          motivo_tipo: motivoTipo,
          cantidad: Number(cantidad),
          motivo,
          fecha: new Date(fecha).toISOString()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'No se pudo registrar el movimiento');
      }

      await cargarDatos();
      limpiarFormulario();
    } catch (err: any) {
      alert(err.message || 'Error en la operación');
    } finally {
      setProcesando(false);
    }
  };

  const totalEntradas = movimientos
    .filter((movimiento) => movimiento.tipo === 'ENTRADA')
    .reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);
  const totalSalidas = movimientos
    .filter((movimiento) => movimiento.tipo === 'SALIDA' || movimiento.tipo === 'VENTA')
    .reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);
  const productosBajoMinimo = productos.filter(
    (producto) => Number(producto.stock_actual) <= Number(producto.stock_minimo)
  ).length;
  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const termino = busqueda.trim().toLocaleLowerCase();
    const coincideBusqueda = !termino || [
      movimiento.nombre_producto,
      movimiento.codigo_producto,
      movimiento.motivo,
      MOTIVOS[movimiento.motivo_tipo],
    ].some((valor) => valor?.toLocaleLowerCase().includes(termino));
    const coincideTipo = filtroTipo === 'TODOS' || (
      filtroTipo === 'ENTRADA' ? movimiento.tipo === 'ENTRADA' : movimiento.tipo !== 'ENTRADA'
    );
    return coincideBusqueda && coincideTipo;
  });

  const limpiarFormulario = () => {
    setMovimientoEditando(null);
    setProductoId('');
    setTipo('ENTRADA');
    setMotivoTipo('COMPRA');
    setCantidad(1);
    setMotivo('');
    setFecha(getLocalDateTimeInput());
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <header className="pb-6 border-b border-white/10">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white flex items-center gap-3">
            <ArrowsRightLeftIcon className="w-8 h-8 text-[#E50914]" /> Control de Movimientos de Inventario
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro manual de entradas (compras/abasto) y salidas (bajas/uso)
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Resumen de inventario">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-slate-400">Productos registrados</p>
            <p className="mt-2 text-2xl font-black">{productos.length}</p>
          </div>
          <div className={`bg-[#0f0f0f] border rounded-xl p-5 ${productosBajoMinimo ? 'border-amber-500/30' : 'border-white/10'}`}>
            <p className="text-xs font-bold uppercase text-slate-400">Stock bajo o mínimo</p>
            <p className={`mt-2 text-2xl font-black ${productosBajoMinimo ? 'text-amber-400' : 'text-white'}`}>{productosBajoMinimo}</p>
          </div>
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-slate-400">Unidades recibidas</p>
            <p className="mt-2 text-2xl font-black text-emerald-400">{totalEntradas}</p>
          </div>
          <div className="bg-[#0f0f0f] border border-red-500/20 rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-slate-400">Unidades descontadas</p>
            <p className="mt-2 text-2xl font-black text-red-400">{totalSalidas}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario de Registro */}
          <div id="form-movimiento" className="bg-[#0f0f0f]/95 p-6 rounded-[2rem] border border-white/10 shadow-2xl h-fit space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white">{movimientoEditando ? 'Editar Movimiento' : 'Registrar Movimiento'}</h2>
              {movimientoEditando && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" /> Cancelar
                </button>
              )}
            </div>
            
            <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Producto</label>
                <select
                  required
                  value={productoId}
                  onChange={(e) => setProductoId(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                >
                  <option value="">-- Seleccionar Producto --</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.categoria || 'General'} · {p.nombre} (Stock: {p.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Operación</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setTipo('ENTRADA'); setMotivoTipo('COMPRA'); }}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 border transition-all ${
                      tipo === 'ENTRADA'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-lg'
                        : 'bg-black/40 border-white/10 text-slate-400'
                    }`}
                  >
                    <ArrowDownCircleIcon className="w-4 h-4" /> Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipo('SALIDA'); setMotivoTipo('VENTA'); }}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 border transition-all ${
                      tipo === 'SALIDA'
                        ? 'bg-red-950/80 border-red-500 text-red-400 shadow-lg'
                        : 'bg-black/40 border-white/10 text-slate-400'
                    }`}
                  >
                    <ArrowUpCircleIcon className="w-4 h-4" /> Salida
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Motivo del movimiento</label>
                <select
                  required
                  value={motivoTipo}
                  onChange={(event) => setMotivoTipo(event.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                >
                  {(tipo === 'ENTRADA' ? ['COMPRA', 'AJUSTE', 'OTRO'] : ['VENTA', 'USO_INTERNO', 'DANO', 'DONACION', 'AJUSTE', 'OTRO'])
                    .map((opcion) => <option key={opcion} value={opcion}>{MOTIVOS[opcion]}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cantidad</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label>
                <input
                  type="datetime-local"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nota / Observación</label>
                <input
                  type="text"
                  placeholder="Ej: Compra a proveedor / Baja"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <button
                type="submit"
                disabled={procesando}
                className="w-full bg-[#E50914] hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                {procesando ? 'Guardando...' : movimientoEditando ? 'Guardar Cambios' : 'Aplicar Movimiento'}
              </button>
            </form>
          </div>

          {/* Historial de Movimientos */}
          <div className="lg:col-span-2 bg-[#0f0f0f]/95 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-white">Historial de Movimientos</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 sm:w-64">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar producto o motivo"
                    aria-label="Buscar en el historial"
                    className="w-full rounded-lg border border-white/10 bg-black/60 py-2 pl-9 pr-3 text-xs text-white focus:border-[#E50914] focus:outline-none"
                  />
                </label>
                <select
                  value={filtroTipo}
                  onChange={(event) => setFiltroTipo(event.target.value as 'TODOS' | 'ENTRADA' | 'SALIDA')}
                  aria-label="Filtrar por tipo de movimiento"
                  className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#E50914] focus:outline-none"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="ENTRADA">Entradas</option>
                  <option value="SALIDA">Salidas</option>
                </select>
              </div>
            </div>
            
            {cargando ? (
              <div className="p-8 text-center text-slate-400 flex justify-center items-center gap-3">
                <ArrowPathIcon className="w-5 h-5 animate-spin text-[#E50914]" /> Cargando historial...
              </div>
            ) : movimientos.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay movimientos registrados en el historial.
              </div>
            ) : movimientosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay movimientos que coincidan con los filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider bg-black/40">
                      <th className="p-3 pl-4">Fecha</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Tipo / Motivo</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3 pr-4">Nota</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {movimientosFiltrados.map((m) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-all">
                        <td className="p-3 pl-4 font-mono text-xs text-slate-400">
                          {new Date(m.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-3 font-bold text-white">{m.nombre_producto || `Prod #${m.producto_id}`}</td>
                        <td className="p-3 font-mono text-xs text-slate-400">{m.codigo_producto || '-'}</td>
                        <td className="p-3">
                          {m.tipo === 'ENTRADA' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                              <ArrowDownCircleIcon className="w-4 h-4" /> {MOTIVOS[m.motivo_tipo] || 'Entrada'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                              <ArrowUpCircleIcon className="w-4 h-4" /> {m.tipo === 'VENTA' || m.motivo_tipo === 'VENTA' ? 'Venta' : MOTIVOS[m.motivo_tipo] || 'Salida'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{m.cantidad}</td>
                        <td className="p-3 pr-4 text-xs text-slate-400">{m.motivo || '-'}</td>
                        <td className="p-3 text-right">
                          {m.tipo !== 'VENTA' && (
                            <button
                              type="button"
                              title="Editar movimiento"
                              aria-label={`Editar movimiento de ${m.nombre_producto || 'producto'}`}
                              onClick={() => {
                                setMovimientoEditando(m.id);
                                setProductoId(m.producto_id);
                                setTipo(m.tipo === 'ENTRADA' ? 'ENTRADA' : 'SALIDA');
                                setMotivoTipo(m.motivo_tipo);
                                setCantidad(Number(m.cantidad));
                                setMotivo(m.motivo || '');
                                setFecha(toLocalDateTimeInput(m.fecha));
                                document.getElementById('form-movimiento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className="rounded-md border border-white/10 p-2 text-slate-300 transition-colors hover:border-[#E50914]/50 hover:text-white"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}