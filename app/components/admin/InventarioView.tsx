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
  transaccion_id?: string | null;
  codigo_seguimiento?: string | null;
}

interface InventarioViewProps {
  vista: 'historial' | 'registrar';
  onNavigate: (vista: string) => void;
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

export default function InventarioView({ vista, onNavigate }: InventarioViewProps) {
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
  const [confirmacion, setConfirmacion] = useState('');

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

  useEffect(() => {
    if (vista === 'registrar' && movimientoEditando) {
      document.getElementById('form-movimiento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [vista, movimientoEditando]);

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

      const resultado = await res.json();
      setConfirmacion(movimientoEditando
        ? 'Movimiento actualizado correctamente.'
        : resultado.codigo_seguimiento
          ? `Movimiento registrado con código ${resultado.codigo_seguimiento}.`
          : 'Movimiento registrado correctamente.');
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
      movimiento.codigo_seguimiento,
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

  const gruposMovimiento = movimientosFiltrados.reduce((grupos, movimiento) => {
    const clave = movimiento.transaccion_id || movimiento.codigo_seguimiento || `movimiento-${movimiento.id}`;
    const grupo = grupos.get(clave) || [];
    grupo.push(movimiento);
    grupos.set(clave, grupo);
    return grupos;
  }, new Map<string, Movimiento[]>());

  return (
    <div className="inventory-light min-h-screen bg-[#030303] p-4 font-sans text-white md:p-8">
      <div className={`mx-auto space-y-8 ${vista === 'historial' ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        
        {/* Cabecera */}
        <header className="pb-6 border-b border-white/10">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white flex items-center gap-3">
            <ArrowsRightLeftIcon className="w-8 h-8 text-[#E50914]" />
            {vista === 'historial' ? 'Historial de movimientos' : 'Registrar movimiento'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {vista === 'historial'
              ? 'Consulta las entradas y salidas registradas en el inventario.'
              : 'Registra entradas y salidas manuales del inventario.'}
          </p>
        </header>

        {vista === 'registrar' && confirmacion && (
          <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm font-semibold text-emerald-300">
            {confirmacion}
          </p>
        )}

        {vista === 'registrar' && <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Resumen de inventario">
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
        </section>}

        <div className={vista === 'registrar' ? 'mx-auto max-w-3xl' : ''}>
          
          {/* Formulario de Registro */}
          <div id="form-movimiento" className={`${vista === 'historial' ? 'hidden' : ''} bg-[#0f0f0f]/95 p-6 rounded-[2rem] border border-white/10 shadow-2xl h-fit space-y-6`}>
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
                      {p.nombre} (Stock: {p.stock_actual})
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
          <div className={`${vista === 'registrar' ? 'hidden' : ''} bg-[#0f0f0f]/95 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl p-6 space-y-4`}>
            <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Historial</h2>
                <p className="mt-1 text-xs text-slate-400">Consulta cada operación y su código de seguimiento.</p>
              </div>
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
                      <th className="p-3">Seguimiento</th>
                      <th className="p-3">Productos</th>
                      <th className="p-3">Tipo / Motivo</th>
                      <th className="p-3">Unidades</th>
                      <th className="p-3">Total venta</th>
                      <th className="p-3 text-right">Detalle / acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {Array.from(gruposMovimiento.entries()).map(([clave, grupo]) => {
                      const principal = grupo[0];
                      const esVenta = principal.motivo_tipo === 'VENTA' || principal.tipo === 'VENTA';
                      const unidades = grupo.reduce((total, item) => total + Number(item.cantidad), 0);
                      const totalVenta = esVenta
                        ? grupo.reduce((total, item) => total + Number(item.cantidad) * Number(item.precio_unitario), 0)
                        : 0;
                      return (
                        <tr key={clave} className="hover:bg-white/5 transition-all">
                          <td className="p-3 pl-4 align-top">
                            <span className="block whitespace-nowrap font-mono text-xs text-slate-400">
                              {new Date(principal.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </td>
                          <td className="p-3 align-top font-mono text-[10px] text-emerald-300">{principal.codigo_seguimiento || '-'}</td>
                          <td className="p-3 align-top font-semibold text-slate-800">
                            {grupo.length} {grupo.length === 1 ? 'producto' : 'productos'}
                          </td>
                          <td className="p-3 align-top">
                            {esVenta ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                                <ArrowUpCircleIcon className="h-4 w-4" /> Venta
                              </span>
                            ) : principal.tipo === 'ENTRADA' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <ArrowDownCircleIcon className="h-4 w-4" /> {MOTIVOS[principal.motivo_tipo] || 'Entrada'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                                <ArrowUpCircleIcon className="h-4 w-4" /> {MOTIVOS[principal.motivo_tipo] || 'Salida'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 align-top font-mono font-bold text-white">{unidades}</td>
                          <td className="p-3 align-top font-mono text-xs text-slate-300">
                            {esVenta ? `$${totalVenta.toLocaleString('es-CO')} COP` : '-'}
                          </td>
                          <td className="p-3 text-right align-top">
                            <div className="flex justify-end gap-1">
                              <details className="relative text-left">
                                <summary
                                  aria-label={`Ver detalle de ${esVenta ? 'venta' : 'movimiento'} ${principal.codigo_seguimiento || principal.id}`}
                                  title="Ver productos"
                                  className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-white/10 text-slate-300 hover:bg-white/5"
                                >
                                  <MagnifyingGlassIcon className="h-4 w-4" />
                                </summary>
                                <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-white/10 bg-[#0f0f0f] p-3 text-left shadow-xl">
                                  <p className="mb-2 text-xs font-bold text-white">Productos de la operación</p>
                                  <ul className="space-y-2">
                                    {grupo.map((item) => (
                                      <li key={item.id} className="flex justify-between gap-3 text-xs">
                                        <span className="text-slate-300">{item.nombre_producto || `Prod #${item.producto_id}`} <span className="text-slate-500">{item.codigo_producto || ''}</span></span>
                                        <strong className="whitespace-nowrap text-white">{item.cantidad} uds.</strong>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </details>
                              {grupo.length === 1 && !esVenta && (
                              <button
                                type="button"
                                title="Editar movimiento"
                                aria-label={`Editar movimiento de ${principal.nombre_producto || 'producto'}`}
                                onClick={() => {
                                  setMovimientoEditando(principal.id);
                                  setProductoId(principal.producto_id);
                                  setTipo(principal.tipo === 'ENTRADA' ? 'ENTRADA' : 'SALIDA');
                                  setMotivoTipo(principal.motivo_tipo);
                                  setCantidad(Number(principal.cantidad));
                                  setMotivo(principal.motivo || '');
                                  setFecha(toLocalDateTimeInput(principal.fecha));
                                  onNavigate('registrar-movimiento');
                                }}
                                className="rounded-md border border-white/10 p-2 text-slate-300 transition-colors hover:border-[#E50914]/50 hover:text-white"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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