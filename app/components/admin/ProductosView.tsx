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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [mensajeCarga, setMensajeCarga] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // Formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
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
    let activo = true;
    const sincronizarCatalogo = async () => {
      setImportando(true);
      try {
        const response = await fetch('/api/productos/importar', { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo integrar el catálogo WR Colombia.');
        if (activo) {
          setMensajeCarga(
            `Catálogo WR integrado: ${data.agregados} agregados, ${data.existentes} ya existentes${data.retirados ? ` y ${data.retirados} productos Bolt retirados` : ''}.`
          );
        }
      } catch (caught) {
        if (activo) setMensajeCarga(caught instanceof Error ? caught.message : 'Error al integrar el catálogo.');
      }

      try {
        const response = await fetch('/api/productos', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catálogo.');
        if (activo) setProductos(Array.isArray(data) ? data : []);
      } catch (caught) {
        if (activo) setMensajeCarga(caught instanceof Error ? caught.message : 'Error al cargar productos.');
      } finally {
        if (activo) setImportando(false);
      }
    };

    void sincronizarCatalogo();
    return () => { activo = false; };
  }, []);

  const abrirModal = (prod: Producto | null = null) => {
    setErrorModal('');
    if (prod) {
      setEditando(prod);
      setCodigo(prod.codigo || '');
      setNombre(prod.nombre || '');
      setPrecio(prod.precio.toString());
      setStockActual(prod.stock_actual.toString());
      setStockMinimo(prod.stock_minimo.toString());
    } else {
      setEditando(null);
      setCodigo('');
      setNombre('');
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
      ...(editando ? { id: editando.id } : {}),
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      categoria: 'General',
      precio: parseFloat(precio),
      stock_actual: parseInt(stockActual, 10),
      stock_minimo: parseInt(stockMinimo, 10),
    };

    if (!payload.codigo || !payload.nombre) {
      setErrorModal('El código y el nombre son obligatorios.');
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
      const url = '/api/productos';
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
    if (!confirm(`¿Retirar "${p.nombre}" del catálogo? Sus movimientos históricos se conservarán.`)) return;

    try {
      const res = await fetch('/api/productos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      });
      if (res.ok) {
        cargarProductos();
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo retirar el producto del catálogo.');
      }
    } catch {
      alert('Error al intentar eliminar.');
    }
  };

  const filtrados = productos
    .filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500">Administra tu catálogo y las cantidades disponibles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {importando && <span role="status" className="self-center text-xs font-medium text-blue-700">Integrando catálogo WR Colombia...</span>}
          <button
            type="button"
            onClick={() => abrirModal(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f5a8a] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#174a74]"
          >
            <PlusIcon className="h-5 w-5" /> Nuevo producto
          </button>
        </div>
      </header>

      {mensajeCarga && <p role="status" className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">{mensajeCarga}</p>}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <p className="text-sm text-slate-500">{filtrados.length} productos</p>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Disponible</th>
                <th className="px-4 py-3">Stock mínimo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No hay productos que coincidan con la búsqueda o el catálogo está vacío.
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => {
                  const reponer = Number(p.stock_actual) <= Number(p.stock_minimo);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-blue-50/50">
                      <td className="flex items-center gap-3 px-4 py-3 font-semibold">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-sm font-bold text-blue-800">
                          {p.nombre.charAt(0).toUpperCase()}
                        </span>
                        {p.nombre}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.codigo}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        ${Number(p.precio).toLocaleString('es-CO')} COP
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.stock_actual}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.stock_minimo} unidades</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${
                          reponer ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'
                        }`}>
                          {reponer ? 'Reponer' : 'Disponible'}
                        </span>
                      </td>
                      <td className="space-x-2 px-4 py-3 text-right">
                        <button type="button" title="Editar producto" aria-label={`Editar ${p.nombre}`} onClick={() => abrirModal(p)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-800 transition-colors hover:bg-blue-100">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button type="button" title="Retirar del catálogo" aria-label={`Retirar ${p.nombre} del catálogo`} onClick={() => handleEliminar(p)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-md space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button type="button" aria-label="Cerrar" onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-900">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {errorModal && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                {errorModal}
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold uppercase text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 rounded-lg bg-[#1f5a8a] py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#174a74] disabled:opacity-50"
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