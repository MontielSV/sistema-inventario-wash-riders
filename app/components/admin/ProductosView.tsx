'use client';
import { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  precio: number;
}

export default function ProductosView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modales y Formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);

  const [codigo, setCodigo] = useState('');
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
      if (res.ok) {
        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const abrirCrear = () => {
    setProductoEditar(null);
    setCodigo(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
    setNombre('');
    setCategoria('');
    setStockActual(0);
    setStockMinimo(5);
    setPrecio(0);
    setMostrarModal(true);
  };

  const abrirEditar = (p: Producto) => {
    setProductoEditar(p);
    setCodigo(p.codigo || '');
    setNombre(p.nombre);
    setCategoria(p.categoria || '');
    setStockActual(p.stock_actual);
    setStockMinimo(p.stock_minimo);
    setPrecio(p.precio);
    setMostrarModal(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (precio < 0 || stockActual < 0 || stockMinimo < 0) {
      alert('Los valores numéricos no pueden ser negativos.');
      return;
    }

    setGuardando(true);
    const metodo = productoEditar ? 'PUT' : 'POST';
    const bodyData = {
      id: productoEditar?.id,
      codigo,
      nombre,
      categoria,
      stock_actual: Number(stockActual),
      stock_minimo: Number(stockMinimo),
      precio: Number(precio)
    };

    try {
      const res = await fetch('/api/productos', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setMostrarModal(false);
        cargarProductos();
      } else {
        alert('Error al guardar el producto');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado de búsqueda
  const productosFiltrados = productos.filter((p) =>
    (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  // Métrica Resumen (Requisito 12)
  const totalProductos = productos.length;
  const unidadesTotales = productos.reduce((acc, p) => acc + Number(p.stock_actual), 0);
  const stockBajoCount = productos.filter(p => p.stock_actual <= p.stock_minimo).length;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white flex items-center gap-3">
              <CubeIcon className="w-8 h-8 text-[#E50914]" /> Inventario Wash Riders
            </h1>
            <p className="text-xs text-slate-400 mt-1">Gestión integral de productos y existencias</p>
          </div>

          <button
            onClick={abrirCrear}
            className="bg-[#E50914] hover:bg-red-700 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> Agregar Producto
          </button>
        </header>

        {/* Tarjetas de Resumen (Requisito 12) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0f0f0f]/95 p-6 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase">Total Productos</p>
            <p className="text-3xl font-black font-mono mt-1 text-white">{totalProductos}</p>
          </div>
          <div className="bg-[#0f0f0f]/95 p-6 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase">Unidades Disponibles</p>
            <p className="text-3xl font-black font-mono mt-1 text-emerald-400">{unidadesTotales}</p>
          </div>
          <div className="bg-[#0f0f0f]/95 p-6 rounded-2xl border border-white/10 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase">Productos con Stock Bajo</p>
            <p className="text-3xl font-black font-mono mt-1 text-red-500">{stockBajoCount}</p>
          </div>
        </div>

        {/* Barra de Búsqueda (Requisito 4) */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre, código o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#0f0f0f]/95 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#E50914] transition-all"
          />
        </div>

        {/* Tabla */}
        <div className="bg-[#0f0f0f]/95 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
          {cargando ? (
            <div className="p-12 text-center text-slate-400 flex justify-center items-center gap-3">
              <ArrowPathIcon className="w-5 h-5 animate-spin text-[#E50914]" /> Cargando datos...
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No se encontraron productos.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider bg-black/40">
                    <th className="p-4 pl-6">Código</th>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 pr-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {productosFiltrados.map((item) => {
                    const bajoStock = item.stock_actual <= item.stock_minimo;
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-all">
                        <td className="p-4 pl-6 font-mono text-xs text-slate-400">{item.codigo || `ID-${item.id}`}</td>
                        <td className="p-4 font-bold text-white">{item.nombre}</td>
                        <td className="p-4 text-slate-400">{item.categoria || 'General'}</td>
                        <td className="p-4 font-mono font-bold text-emerald-400">${Number(item.precio).toLocaleString('es-CO')}</td>
                        <td className="p-4 font-mono font-bold text-white">{item.stock_actual}</td>
                        <td className="p-4">
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
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => abrirEditar(item)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                            title="Editar"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Crear / Editar */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl">
              <h2 className="text-xl font-black text-white italic">
                {productoEditar ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              
              <form onSubmit={handleGuardar} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código de Producto</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white font-mono focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Categoría</label>
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#E50914]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Precio ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={precio}
                      onChange={(e) => setPrecio(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-[#E50914]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cantidad</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={stockActual}
                      onChange={(e) => setStockActual(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-[#E50914]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stock Mín.</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={stockMinimo}
                      onChange={(e) => setStockMinimo(Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-[#E50914]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400"
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