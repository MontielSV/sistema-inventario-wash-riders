'use client';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCartIcon, TrashIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  stock_actual: number;
}

interface ItemCarrito extends Producto {
  cantidadVenta: number;
  subtotal: number;
}

export default function RegistrarVentaView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [listaAbierta, setListaAbierta] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadInput, setCantidadInput] = useState(1);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [motivo, setMotivo] = useState('Venta');
  const [motivoOtro, setMotivoOtro] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [exitoMsg, setExitoMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

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

  // Calcular existencias restantes considerando lo ya agregado al carrito
  const obtenerDisponibleRestante = (p: Producto) => {
    const enCarrito = carrito.find((item) => item.id === p.id);
    return p.stock_actual - (enCarrito ? enCarrito.cantidadVenta : 0);
  };

  const filtrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const seleccionarProducto = (p: Producto) => {
    if (obtenerDisponibleRestante(p) <= 0) return;
    setProductoSeleccionado(p);
    setBusqueda(`${p.codigo} - ${p.nombre}`);
    setListaAbierta(false);
    setCantidadInput(1);
  };

  const handleKeyDownBusqueda = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setListaAbierta(false);
    } else if (e.key === 'Enter' && filtrados.length > 0) {
      e.preventDefault();
      const primerConStock = filtrados.find((p) => obtenerDisponibleRestante(p) > 0);
      if (primerConStock) seleccionarProducto(primerConStock);
    }
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    const disponible = obtenerDisponibleRestante(productoSeleccionado);

    if (cantidadInput > disponible) {
      setErrorMsg(`Solo quedan ${disponible} unidades disponibles de este producto.`);
      return;
    }

    setErrorMsg('');
    const existe = carrito.find((i) => i.id === productoSeleccionado.id);

    if (existe) {
      setCarrito(
        carrito.map((i) =>
          i.id === productoSeleccionado.id
            ? {
                ...i,
                cantidadVenta: i.cantidadVenta + cantidadInput,
                subtotal: (i.cantidadVenta + cantidadInput) * i.precio,
              }
            : i
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          ...productoSeleccionado,
          cantidadVenta: cantidadInput,
          subtotal: cantidadInput * productoSeleccionado.precio,
        },
      ]);
    }

    setProductoSeleccionado(null);
    setBusqueda('');
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(carrito.filter((i) => i.id !== id));
  };

  const totalVenta = carrito.reduce((acc, i) => acc + i.subtotal, 0);

  const handleConfirmar = async () => {
    if (carrito.length === 0) {
      setErrorMsg('Agrega al menos un producto a la venta.');
      return;
    }

    if (motivo === 'Otro' && (!motivoOtro.trim() || motivoOtro.length > 140)) {
      setErrorMsg('El detalle del motivo "Otro" es obligatorio y debe tener máximo 140 caracteres.');
      return;
    }

    setProcesando(true);
    setErrorMsg('');
    setExitoMsg('');

    const motivoFinal = motivo === 'Otro' ? `Otro: ${motivoOtro.trim()}` : motivo;

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map((i) => ({
            producto_id: i.id,
            cantidad: i.cantidadVenta,
            precio_unitario: i.precio,
          })),
          motivo: motivoFinal,
          tipo: motivo === 'Venta' ? 'VENTA' : 'SALIDA',
          total: totalVenta,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExitoMsg(data.mensaje || 'Venta registrada y disponibilidad actualizada.');
        setCarrito([]);
        setMotivo('Venta');
        setMotivoOtro('');
        setProductoSeleccionado(null);
        cargarProductos();
      } else {
        setErrorMsg(data.error || 'Error procesando la operación.');
      }
    } catch {
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans space-y-6">
      <header className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-3">
          <ShoppingCartIcon className="w-8 h-8 text-[#E50914]" /> Registrar Venta
        </h1>
        <p className="text-xs text-slate-400">Prepara una operación con uno o varios productos en el carrito</p>
      </header>

      {exitoMsg && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 shrink-0" /> {exitoMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/60 border border-red-500/40 p-4 rounded-2xl text-red-400 text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Selector y Controles de Adición */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 space-y-4 relative">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Selector de Producto</h3>

            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar por código o nombre..."
                value={busqueda}
                onFocus={() => setListaAbierta(true)}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setProductoSeleccionado(null);
                  setListaAbierta(true);
                }}
                onKeyDown={handleKeyDownBusqueda}
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
              />

              {/* Lista Desplegable */}
              {listaAbierta && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/10 rounded-2xl max-h-60 overflow-y-auto z-30 shadow-2xl">
                  {filtrados.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 text-center">No hay productos que coincidan.</div>
                  ) : (
                    filtrados.map((p) => {
                      const disponible = obtenerDisponibleRestante(p);
                      const sinStock = disponible <= 0;
                      return (
                        <div
                          key={p.id}
                          onClick={() => !sinStock && seleccionarProducto(p)}
                          className={`p-3 border-b border-white/5 flex justify-between items-center text-xs transition-colors ${
                            sinStock ? 'opacity-40 cursor-not-allowed bg-black/20' : 'hover:bg-white/5 cursor-pointer'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white">{p.nombre}</span>
                            <span className="ml-2 font-mono text-slate-500">({p.codigo})</span>
                          </div>
                          <span className={`font-bold ${sinStock ? 'text-red-400' : 'text-slate-300'}`}>
                            {disponibles === 0 ? 'Sin stock' : `${disponible} disponibles`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Fila de Cantidad y Botón Agregar */}
            <div className="flex gap-4 items-end pt-2">
              <div className="w-32">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  max={productoSeleccionado ? obtenerDisponibleRestante(productoSeleccionado) : 1}
                  value={cantidadInput}
                  onChange={(e) => setCantidadInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono text-center"
                />
              </div>

              <button
                onClick={agregarAlCarrito}
                disabled={!productoSeleccionado || obtenerDisponibleRestante(productoSeleccionado) < cantidadInput}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Agregar Producto
              </button>
            </div>
          </div>

          {/* Tabla de Productos en el Carrito */}
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Productos en la Venta</h3>
              <span className="text-xs text-slate-500 font-mono">{carrito.length} referencias</span>
            </div>

            {carrito.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">El carrito está vacío. Agrega productos desde la lista.</p>
            ) : (
              <div className="space-y-2">
                {carrito.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <p className="font-bold text-xs">{item.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Código: {item.codigo} | {item.cantidadVenta} u. x ${item.precio.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ${item.subtotal.toLocaleString('es-CO')} COP
                      </span>
                      <button 
                        aria-label={`Quitar ${item.nombre}`} 
                        onClick={() => eliminarDelCarrito(item.id)} 
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Operación y Motivo */}
        <div className="lg:col-span-5 bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-black italic border-b border-white/10 pb-3">Resumen de Venta</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Items en Carrito:</span>
                <span className="font-bold">{carrito.length} referencias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Parcial:</span>
                <span className="font-mono font-bold text-emerald-400">${totalVenta.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            {/* Selector de Motivo */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="block text-xs font-bold text-slate-400 uppercase">Motivo de Salida</label>
              <select
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (e.target.value !== 'Otro') setMotivoOtro('');
                }}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E50914]"
              >
                <option value="Venta">Venta (Suma a reportes)</option>
                <option value="Uso interno">Uso interno (No suma a ventas)</option>
                <option value="Otro">Otro motivo</option>
              </select>

              {motivo === 'Otro' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Detalle del motivo (Máx 140 chars)</label>
                  <input
                    type="text"
                    maxLength={140}
                    placeholder="Descripción breve..."
                    value={motivoOtro}
                    onChange={(e) => setMotivoOtro(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span>Total Final:</span>
              <span className="text-xl font-mono text-emerald-400 font-black">${totalVenta.toLocaleString('es-CO')} COP</span>
            </div>

            <button
              onClick={handleConfirmar}
              disabled={carrito.length === 0 || procesando}
              className="w-full bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 border border-red-500/30 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              {procesando ? 'Registrando…' : motivo === 'Venta' ? 'Confirmar Venta' : 'Confirmar Salida'}
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              El inventario se reducirá inmediatamente al confirmar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}