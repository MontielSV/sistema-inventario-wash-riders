'use client';
import { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, CubeIcon, PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SectionHeader from './SectionHeader';

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
  const [errorCarga, setErrorCarga] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [productoPorRetirar, setProductoPorRetirar] = useState<Producto | null>(null);
  const [retirando, setRetirando] = useState(false);
  const [errorRetiro, setErrorRetiro] = useState('');
  const dialogoRetiroRef = useRef<HTMLDialogElement>(null);

  // Formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('0');
  const [stockActual, setStockActual] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('4');

  useEffect(() => {
    const dialogo = dialogoRetiroRef.current;
    if (productoPorRetirar && dialogo && !dialogo.open) dialogo.showModal();
  }, [productoPorRetirar]);

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
      } catch (caught) {
        if (activo) setErrorCarga(caught instanceof Error ? caught.message : 'Error al integrar el catálogo.');
      }

      try {
        const response = await fetch('/api/productos', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catálogo.');
        if (activo) {
          setProductos(Array.isArray(data) ? data : []);
        }
      } catch (caught) {
        if (activo) setErrorCarga(caught instanceof Error ? caught.message : 'Error al cargar productos.');
      } finally {
        if (activo) setImportando(false);
      }
    };

    void sincronizarCatalogo();
    return () => { activo = false; };
  }, []);

  const abrirModal = (prod: Producto | null = null) => {
    setErrorModal('');
    setMensajeExito('');
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
        const eraEdicion = Boolean(editando);
        setModalAbierto(false);
        setMensajeExito(
          eraEdicion
            ? `Cambios guardados. Se actualizó el producto "${payload.nombre}".`
            : `Producto "${payload.nombre}" creado correctamente.`
        );
        void cargarProductos();
      } else {
        setErrorModal(data.error || 'Ya existe un producto con ese código.');
      }
    } catch {
      setErrorModal('Error guardando el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarRetiro = async () => {
    if (!productoPorRetirar) return;
    setErrorRetiro('');
    try {
      const res = await fetch('/api/productos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productoPorRetirar.id }),
      });
      if (res.ok) {
        const nombreRetirado = productoPorRetirar.nombre;
        dialogoRetiroRef.current?.close();
        setMensajeExito(`Producto "${nombreRetirado}" retirado del catálogo. Sus movimientos históricos se conservaron.`);
        setErrorCarga('');
        void cargarProductos();
      } else {
        const data = await res.json();
        setErrorRetiro(data.error || 'No se pudo retirar el producto del catálogo.');
      }
    } catch {
      setErrorRetiro('No se pudo conectar con el servidor para retirar el producto.');
    } finally {
      setRetirando(false);
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
      <SectionHeader
        accent="sky"
        title="Productos"
        description="Administra el catálogo, los precios y las existencias de tus productos."
        icon={<CubeIcon className="h-6 w-6" />}
      >
          {importando && <span role="status" className="self-center text-xs font-medium text-blue-700">Integrando catálogo WR Colombia...</span>}
          <button
            type="button"
            onClick={() => abrirModal(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f5a8a] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#174a74]"
          >
            <PlusIcon className="h-5 w-5" /> Nuevo producto
          </button>
      </SectionHeader>

      {errorCarga && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errorCarga}</p>}
      {mensajeExito && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4 print:hidden">
          <div role="status" className="pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-2xl shadow-slate-950/25">
            <CheckCircleIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <p className="flex-1 font-medium">{mensajeExito}</p>
            <button type="button" onClick={() => setMensajeExito('')} aria-label="Cerrar mensaje" className="rounded p-1 text-emerald-800 hover:bg-emerald-100">
              <XMarkIcon aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
                <th className="px-4 py-3 text-center">Acciones</th>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" title="Editar producto" aria-label={`Editar ${p.nombre}`} onClick={() => abrirModal(p)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-800 transition-colors hover:bg-blue-100">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button type="button" title="Retirar del catálogo" aria-label={`Retirar ${p.nombre} del catálogo`} onClick={() => { setMensajeExito(''); setErrorRetiro(''); setProductoPorRetirar(p); }} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
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

      <dialog
        ref={dialogoRetiroRef}
        aria-labelledby="retirar-producto-titulo"
        aria-describedby="retirar-producto-descripcion"
        onClose={() => setProductoPorRetirar(null)}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-rose-100 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60"
      >
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <TrashIcon aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 id="retirar-producto-titulo" className="text-lg font-bold">¿Retirar producto?</h2>
          <p id="retirar-producto-descripcion" className="mt-2 text-sm leading-6 text-slate-600">
            {productoPorRetirar
              ? `Se retirará "${productoPorRetirar.nombre}" del catálogo. Sus movimientos históricos se conservarán.`
              : 'El producto se retirará del catálogo y sus movimientos históricos se conservarán.'}
          </p>
          {errorRetiro && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {errorRetiro}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={retirando}
              onClick={() => dialogoRetiroRef.current?.close()}
              className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={retirando}
              onClick={() => {
                setRetirando(true);
                void confirmarRetiro();
              }}
              className="min-h-11 rounded-lg bg-rose-700 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-800 disabled:cursor-wait disabled:opacity-50"
            >
              {retirando ? 'Retirando...' : 'Sí, retirar producto'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}