'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
}

export default function ProductosView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  // Formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('General');
  const [precio, setPrecio] = useState('0');
  const [stockActual, setStockActual] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('4');

  const cargarProductos = async () => {
    try {
      const res = await fetch('/api/productos');
      if (res.ok) {
        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const abrirModal = (prod: Producto | null = null) => {
    setErrorModal('');
    if (prod) {
      setEditando(prod);
      setCodigo(prod.codigo || '');
      setNombre(prod.nombre || '');
      setCategoria(prod.categoria || 'General');
      setPrecio(prod.precio.toString());
      setStockActual(prod.stock_actual.toString());
      setStockMinimo(prod.stock_minimo.toString());
    } else {
      setEditando(null);
      setCodigo('');
      setNombre('');
      setCategoria('General');
      setPrecio('0');
      setStockActual('0');
      setStockMinimo('4');
    }
    setModalAbierto(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal('');

    const payload = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      precio: parseFloat(precio),
      stock_actual: parseInt(stockActual, 10),
      stock_minimo: parseInt(stockMinimo, 10),
    };

    if (!payload.codigo || !payload.nombre || !payload.categoria) {
      setErrorModal('El código, el nombre y la sección son obligatorios.');
      setGuardando(false);
      return;
    }

    if (isNaN(payload.precio) || payload.precio < 0) {
      setErrorModal('El precio no puede ser negativo.');
      setGuardando(false);
      return;
    }

    if (isNaN(payload.stock_actual) || payload.stock_actual < 0 || isNaN(payload.stock_minimo) || payload.stock_minimo < 0) {
      setErrorModal('Las cantidades deben ser números enteros mayores o iguales a cero.');
      setGuardando(false);
      return;
    }

    try {
      const url = editando ? `/api/productos/${editando.id}` : '/api/productos';
      const method = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setModalAbierto(false);
        cargarProductos();
      } else {
        setErrorModal(data.error || 'Ya existe un producto con ese código.');
      }
    } catch {
      setErrorModal('Error guardando el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/productos/${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarProductos();
      } else {
        alert('No se pudo eliminar el producto.');
      }
    } catch {
      alert('Error al intentar eliminar.');
    }
  };

  const categorias = Array.from(
    new Map(
      productos
        .map((producto) => producto.categoria?.trim())
        .filter((nombreCategoria): nombreCategoria is string => Boolean(nombreCategoria))
        .map((nombreCategoria) => [nombreCategoria.toLocaleLowerCase(), nombreCategoria])
    ).values()
  ).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  const filtrados = productos
    .filter(
      (p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
    )
    .filter((p) => !categoriaActiva || p.categoria?.toLocaleLowerCase() === categoriaActiva.toLocaleLowerCase())
    .sort((a, b) =>
      (a.categoria || 'General').localeCompare(b.categoria || 'General', 'es', { sensitivity: 'base' }) ||
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">Productos</h1>
          <p className="text-xs text-slate-400">Catálogo por secciones e inventario disponible</p>
        </div>
        <button
          onClick={() => abrirModal(null)}
          className="bg-[#E50914] hover:bg-red-700 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> Nuevo producto
        </button>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o sección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-11 pr-12 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
            />
            <span className="absolute right-3 top-3 text-[10px] font-mono text-slate-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">⌘ K</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Mostrando {filtrados.length} productos</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Secciones de productos">
          <button
            type="button"
            onClick={() => setCategoriaActiva('')}
            aria-pressed={!categoriaActiva}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
              !categoriaActiva
                ? 'border-[#E50914] bg-red-950/50 text-white'
                : 'border-white/10 bg-[#0f0f0f] text-slate-400 hover:text-white'
            }`}
          >
            Todas ({productos.length})
          </button>
          {categorias.map((nombreCategoria) => {
            const cantidadCategoria = productos.filter(
              (producto) => producto.categoria?.toLocaleLowerCase() === nombreCategoria.toLocaleLowerCase()
            ).length;
            const activa = categoriaActiva.toLocaleLowerCase() === nombreCategoria.toLocaleLowerCase();
            return (
              <button
                key={nombreCategoria.toLocaleLowerCase()}
                type="button"
                onClick={() => setCategoriaActiva(activa ? '' : nombreCategoria)}
                aria-pressed={activa}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  activa
                    ? 'border-[#E50914] bg-red-950/50 text-white'
                    : 'border-white/10 bg-[#0f0f0f] text-slate-400 hover:text-white'
                }`}
              >
                {nombreCategoria} ({cantidadCategoria})
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 border-b border-white/10 text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Producto</th>
                <th className="p-4">Sección</th>
                <th className="p-4">Código</th>
                <th className="p-4">Precio Unitario</th>
                <th className="p-4">Disponible</th>
                <th className="p-4">Stock Mínimo</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No hay productos que coincidan con la búsqueda o el catálogo está vacío.
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => {
                  const reponer = Number(p.stock_actual) <= Number(p.stock_minimo);
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-bold flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-zinc-800 text-white font-black flex items-center justify-center text-sm border border-white/10">
                          {p.nombre.charAt(0).toUpperCase()}
                        </span>
                        {p.nombre}
                      </td>
                      <td className="p-4">
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">
                          {p.categoria || 'General'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">{p.codigo}</td>
                      <td className="p-4 font-mono text-emerald-400 font-bold">
                        ${Number(p.precio).toLocaleString('es-CO')} COP
                      </td>
                      <td className="p-4 font-mono font-bold text-white">{p.stock_actual}</td>
                      <td className="p-4 font-mono text-slate-500">{p.stock_minimo}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          reponer ? 'bg-red-950/80 text-red-400 border border-red-500/30' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {reponer ? 'Reponer' : 'Disponible'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => abrirModal(p)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-slate-300">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEliminar(p)} className="p-1.5 bg-red-950/50 hover:bg-red-900/50 rounded-lg text-red-400 border border-red-500/20">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Diálogo Nuevo / Editar Producto */}
      {modalAbierto && (
        <div 
          onClick={() => setModalAbierto(false)} 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[#0f0f0f] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-black italic text-white">
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {errorModal && (
              <div className="bg-red-950/60 border border-red-500/40 p-3 rounded-xl text-red-400 text-xs font-bold">
                ⚠️ {errorModal}
              </div>
            )}

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Código (Único)</label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sección / Categoría</label>
                <input
                  type="text"
                  required
                  list="categorias-productos"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Repuestos, limpieza, accesorios"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                />
                <datalist id="categorias-productos">
                  {categorias.map((nombreCategoria) => <option key={nombreCategoria} value={nombreCategoria} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Precio Unitario (COP)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Disponible</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-[#E50914] hover:bg-red-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 