'use client';
import { useState, useEffect } from 'react';
import { 
  ArrowsRightLeftIcon, 
  ArrowDownCircleIcon, 
  ArrowUpCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../NotificationProvider';
import SectionHeader from './SectionHeader';

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
  hideHeader?: boolean;
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

export default function InventarioView({ vista, hideHeader = false }: InventarioViewProps) {
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
  const { notify } = useNotifications();

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
      notify('Selecciona un producto.', 'error');
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
      notify(movimientoEditando
        ? 'Movimiento actualizado correctamente.'
        : resultado.codigo_seguimiento
          ? `Movimiento registrado con código ${resultado.codigo_seguimiento}.`
          : 'Movimiento registrado correctamente.');
      await cargarDatos();
      limpiarFormulario();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Error en la operación.', 'error');
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
  const editarDesdeHistorial = vista === 'historial' && movimientoEditando !== null;
  const claseCampo = editarDesdeHistorial
    ? 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
    : 'w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]';
  const claseEtiqueta = 'block text-xs font-bold text-slate-400 uppercase mb-1';

  return (
    <div className={hideHeader ? '' : 'inventory-light min-h-screen bg-[#030303] p-4 font-sans text-white md:p-8'}>
      <div className={`mx-auto ${hideHeader ? 'max-w-[1600px]' : `space-y-8 ${vista === 'historial' ? 'max-w-[1600px]' : 'max-w-7xl'}`}`}>
        {!hideHeader && (
          <SectionHeader
            accent={vista === 'historial' ? 'amber' : 'blue'}
            title={vista === 'historial' ? 'Historial' : 'Movimiento'}
            description={vista === 'historial'
              ? 'Consulta y filtra las entradas y salidas guardadas en el inventario.'
              : 'Registra entradas y salidas manuales para mantener el stock actualizado.'}
            icon={vista === 'historial'
              ? <ClockIcon className="h-6 w-6" />
              : <ArrowsRightLeftIcon className="h-6 w-6" />}
          />
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
          {(vista === 'registrar' || editarDesdeHistorial) && (
          <div
            id="form-movimiento"
            className={editarDesdeHistorial
              ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm'
              : 'bg-[#0f0f0f]/95 p-6 rounded-[2rem] border border-white/10 shadow-2xl h-fit space-y-6'}
            onClick={editarDesdeHistorial ? (event) => {
              if (event.target === event.currentTarget) limpiarFormulario();
            } : undefined}
          >
          <div
            role={editarDesdeHistorial ? 'dialog' : undefined}
            aria-modal={editarDesdeHistorial ? true : undefined}
            aria-labelledby={editarDesdeHistorial ? 'form-movimiento-titulo' : undefined}
            onClick={editarDesdeHistorial ? (event) => event.stopPropagation() : undefined}
            className={editarDesdeHistorial
              ? 'relative max-h-[calc(100vh-2rem)] w-full max-w-md space-y-5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl'
              : 'space-y-6'}
          >
            <div className={`flex items-center justify-between border-b pb-4 ${editarDesdeHistorial ? 'border-slate-200' : 'border-white/5'}`}>
              <h2 id="form-movimiento-titulo" className={editarDesdeHistorial ? 'text-lg font-bold text-slate-900' : 'text-xl font-bold text-white'}>{movimientoEditando ? 'Editar Movimiento' : 'Registrar Movimiento'}</h2>
              {movimientoEditando && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  aria-label={editarDesdeHistorial ? 'Cerrar edición' : undefined}
                  className={`inline-flex items-center gap-1 text-xs font-bold ${editarDesdeHistorial ? 'text-slate-400 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  <XMarkIcon className="w-4 h-4" />{editarDesdeHistorial ? null : ' Cancelar'}
                </button>
              )}
            </div>
            
            <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
              <div>
                <label className={claseEtiqueta}>Producto</label>
                <select
                  required
                  value={productoId}
                  onChange={(e) => setProductoId(Number(e.target.value))}
                  className={claseCampo}
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
                <label className={claseEtiqueta}>Tipo de Operación</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setTipo('ENTRADA'); setMotivoTipo('COMPRA'); }}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 border transition-all ${
                      editarDesdeHistorial
                        ? tipo === 'ENTRADA'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500'
                        : tipo === 'ENTRADA'
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
                      editarDesdeHistorial
                        ? tipo === 'SALIDA'
                          ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500'
                        : tipo === 'SALIDA'
                          ? 'bg-red-950/80 border-red-500 text-red-400 shadow-lg'
                          : 'bg-black/40 border-white/10 text-slate-400'
                    }`}
                  >
                    <ArrowUpCircleIcon className="w-4 h-4" /> Salida
                  </button>
                </div>
              </div>

              <div>
                <label className={claseEtiqueta}>Motivo del movimiento</label>
                <select
                  required
                  value={motivoTipo}
                  onChange={(event) => setMotivoTipo(event.target.value)}
                  className={claseCampo}
                >
                  {(tipo === 'ENTRADA' ? ['COMPRA', 'AJUSTE', 'OTRO'] : ['VENTA', 'USO_INTERNO', 'DANO', 'DONACION', 'AJUSTE', 'OTRO'])
                    .map((opcion) => <option key={opcion} value={opcion}>{MOTIVOS[opcion]}</option>)}
                </select>
              </div>

              <div>
                <label className={claseEtiqueta}>Cantidad</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className={claseCampo}
                />
              </div>

              <div>
                <label className={claseEtiqueta}>Fecha</label>
                <input
                  type="datetime-local"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={claseCampo}
                />
              </div>

              <div>
                <label className={claseEtiqueta}>Nota / Observación</label>
                <input
                  type="text"
                  placeholder="Ej: Compra a proveedor / Baja"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className={claseCampo}
                />
              </div>

              {editarDesdeHistorial ? (
                <div className="flex gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={limpiarFormulario}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className="flex-1 rounded-lg bg-[#1f5a8a] py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#174a74] disabled:opacity-50"
                  >
                    {procesando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full bg-[#E50914] hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  {procesando ? 'Guardando...' : movimientoEditando ? 'Guardar Cambios' : 'Aplicar Movimiento'}
                </button>
              )}
            </form>
          </div>
          </div>
          )}

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
                <table className="w-full min-w-[900px] table-fixed text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider bg-black/40">
                      <th className="w-[14%] p-3 pl-4">Fecha</th>
                      <th className="w-[18%] p-3">Seguimiento</th>
                      <th className="w-[12%] p-3">Productos</th>
                      <th className="w-[20%] p-3">Tipo / Motivo</th>
                      <th className="w-[8%] p-3">Unidades</th>
                      <th className="w-[13%] p-3">Total</th>
                      <th className="w-[15%] p-3 text-right">Detalle / acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {Array.from(gruposMovimiento.entries()).map(([clave, grupo]) => {
                      const principal = grupo[0];
                      const esVenta = principal.motivo_tipo === 'VENTA' || principal.tipo === 'VENTA';
                      const unidades = grupo.reduce((total, item) => total + Number(item.cantidad), 0);
                      const totalOperacion = grupo.reduce(
                        (total, item) => total + Number(item.cantidad) * Number(item.precio_unitario),
                        0,
                      );
                      const mostrarMotivo = Boolean(principal.motivo) && (
                        principal.motivo_tipo === 'OTRO' || principal.motivo !== MOTIVOS[principal.motivo_tipo]
                      );
                      const colorMotivo = esVenta
                        ? 'text-emerald-400'
                        : principal.motivo_tipo === 'COMPRA'
                          ? 'text-red-400'
                          : principal.motivo_tipo === 'OTRO'
                            ? 'text-sky-400'
                            : principal.motivo_tipo === 'DANO'
                              ? 'text-orange-400'
                              : principal.tipo === 'ENTRADA'
                                ? 'text-emerald-400'
                                : 'text-red-400';
                      return (
                        <tr key={clave} className="hover:bg-white/5 transition-all">
                          <td className="p-3 pl-4 align-top">
                            <span className="block whitespace-nowrap font-mono text-xs text-slate-400">
                              {new Date(principal.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </td>
                          <td className="break-all p-3 align-top font-mono text-[10px] text-emerald-300">{principal.codigo_seguimiento || '-'}</td>
                          <td className="p-3 align-top font-semibold text-slate-800">
                            {grupo.length} {grupo.length === 1 ? 'producto' : 'productos'}
                          </td>
                          <td className="p-3 align-top">
                            <span className={`inline-flex items-center gap-1 text-xs font-bold ${colorMotivo}`}>
                              {principal.tipo === 'ENTRADA'
                                ? <ArrowDownCircleIcon className="h-4 w-4" />
                                : <ArrowUpCircleIcon className="h-4 w-4" />}
                              {MOTIVOS[principal.motivo_tipo] || (principal.tipo === 'ENTRADA' ? 'Entrada' : 'Salida')}
                            </span>
                            {mostrarMotivo && (
                              <span className="mt-1 block max-w-56 break-words text-xs font-normal leading-5 text-slate-400">
                                {principal.motivo}
                              </span>
                            )}
                          </td>
                          <td className="p-3 align-top font-mono font-bold text-white">{unidades}</td>
                          <td className="p-3 align-top font-mono text-xs text-slate-300">
                            {`$${totalOperacion.toLocaleString('es-CO')} COP`}
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
                              {(principal.tipo === 'ENTRADA' || (grupo.length === 1 && !esVenta)) && (
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