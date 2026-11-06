'use client';
import { useState, useEffect } from 'react';
import { 
  ArrowsRightLeftIcon, 
  ArrowDownCircleIcon, 
  ArrowUpCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Producto {
  id: number;
  nombre: string;
  stock_actual: number;
}

interface Movimiento {
  id: number;
  producto_id: number;
  nombre_producto?: string;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  motivo: string;
}

export default function InventarioView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario
  const [productoId, setProductoId] = useState<number | ''>('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: Number(productoId),
          tipo,
          cantidad: Number(cantidad),
          motivo,
          fecha
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'No se pudo registrar el movimiento');
      }

      setProductoId('');
      setCantidad(1);
      setMotivo('');
      setFecha(new Date().toISOString().slice(0, 10));
      cargarDatos();
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
    .filter((movimiento) => movimiento.tipo === 'SALIDA')
    .reduce((total, movimiento) => total + Number(movimiento.cantidad), 0);

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

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Resumen de movimientos">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-5">
            <p className="text-xs font-bold uppercase text-slate-400">Movimientos registrados</p>
            <p className="mt-2 text-2xl font-black">{movimientos.length}</p>
          </div>
          <div className="bg-[#0f0f0f] border border-emerald-500/20 rounded-xl p-5">
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
          <div className="bg-[#0f0f0f]/95 p-6 rounded-[2rem] border border-white/10 shadow-2xl h-fit space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Registrar Movimiento</h2>
            
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
                      {p.nombre} (Stock actual: {p.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Operación</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipo('ENTRADA')}
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
                    onClick={() => setTipo('SALIDA')}
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
                  type="date"
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
                {procesando ? 'Guardando...' : 'Aplicar Movimiento'}
              </button>
            </form>
          </div>

          {/* Historial de Movimientos */}
          <div className="lg:col-span-2 bg-[#0f0f0f]/95 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Historial Reciente</h2>
            
            {cargando ? (
              <div className="p-8 text-center text-slate-400 flex justify-center items-center gap-3">
                <ArrowPathIcon className="w-5 h-5 animate-spin text-[#E50914]" /> Cargando historial...
              </div>
            ) : movimientos.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No hay movimientos registrados en el historial.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider bg-black/40">
                      <th className="p-3 pl-4">Fecha</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3 pr-4">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-all">
                        <td className="p-3 pl-4 font-mono text-xs text-slate-400">
                          {new Date(m.fecha).toLocaleDateString('es-CO')}
                        </td>
                        <td className="p-3 font-bold text-white">{m.nombre_producto || `Prod #${m.producto_id}`}</td>
                        <td className="p-3">
                          {m.tipo === 'ENTRADA' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                              <ArrowDownCircleIcon className="w-4 h-4" /> ENTRADA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                              <ArrowUpCircleIcon className="w-4 h-4" /> SALIDA
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{m.cantidad}</td>
                        <td className="p-3 pr-4 text-xs text-slate-400">{m.motivo || '-'}</td>
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