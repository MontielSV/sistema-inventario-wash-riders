'use client';
import { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  precio: number;
}

export default function ProductosView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el formulario de nuevo producto
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(5);
  const [precio, setPrecio] = useState(0);
  const [guardando, setGuardando] = useState(false);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/productos');
      if (!res.ok) throw new Error('Error al cargar la lista de productos');
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : data.productos || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          categoria,
          stock_actual: Number(stockActual),
          stock_minimo: Number(stockMinimo),
          precio: Number(precio)
        })
      });

      if (!res.ok) throw new Error('No se pudo guardar el producto');

      setNombre('');
      setCategoria('');
      setStockActual(0);
      setStockMinimo(5);
      setPrecio(0);
      setMostrarModal(false);
      cargarProductos();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white flex items-center gap-3">
              <CubeIcon className="w-8 h-8 text-[#E50914]" /> Inventario de Productos
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Catálogo general y control de existencias para Wash Riders
            </p>
          </div>

          <button
            onClick={() => setMostrarModal(true)}
            className="bg-[#E50914] hover:bg-red-700 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> Agregar Producto
          </button>
        </header>

        {/* Tabla de Productos */}
        <div className="bg-[#0f0f0f]/95 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
          {cargando ? (
            <div className="p-12 text-center text-slate-400 flex justify-center items-center gap-3">
              <ArrowPathIcon className="w-5 h-5 animate-spin text-[#E50914]" /> Cargando catálogo de productos...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400 font-medium">
              ⚠️ {error}
            </div>
          ) : productos.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No hay productos registrados en el sistema de inventario.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider bg-black/40">
                    <th className="p-4 pl-6">ID</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Existencias</th>
                    <th className="p-4 pr-6 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {productos.map((item) => {
                    const bajoStock = item.stock_actual <= item.stock_minimo;
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-all">
                        <td className="p-4 pl-6 font-mono text-xs text-slate-400">#{item.id}</td>
                        <td className="p-4 font-bold text-white">{item.nombre}</td>
                        <td className="p-4 text-slate-400">{item.categoria || 'General'}</td>
                        <td className="p-4 font-mono font-bold text-emerald-400">
                          ${Number(item.precio).toLocaleString('es-CO')}
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {item.stock_actual}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {bajoStock ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-bold rounded-md">
                              <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Stock Bajo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-md">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Crear Producto */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl">
              <h2 className="text-xl font-black text-white italic">Nuevo Producto</h2>
              
              <form onSubmit={handleCrearProducto} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoría</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Precio ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={precio}
                      onChange={(e) => setPrecio(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={stockActual}
                      onChange={(e) => setStockActual(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="bg-[#E50914] hover:bg-red-700 text-white font-black px-5 py-2 rounded-xl text-xs uppercase"
                  >
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}