'use client';
import { useState, useEffect } from 'react';
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
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [motivo, setMotivo] = useState('Venta');
  const [motivoOtro, setMotivoOtro] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [exitoMsg, setExitoMsg] = useState('');

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

  const agregarAlCarrito = (p: Producto) => {
    const existe = carrito.find((item) => item.id === p.id);
    if (existe) {
      if (existe.cantidadVenta + 1 > p.stock_actual) {
        alert('No hay suficiente stock disponible.');
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.id === p.id
            ? { ...item, cantidadVenta: item.cantidadVenta + 1, subtotal: (item.cantidadVenta + 1) * item.precio }
            : item
        )
      );
    } else {
      if (p.stock_actual < 1) {
        alert('Producto sin existencias.');
        return;
      }
      setCarrito([...carrito, { ...p, cantidadVenta: 1, subtotal: p.precio }]);
    }
  };

  const cambiarCantidad = (id: number, cantidad: number) => {
    const item = carrito.find((i) => i.id === id);
    if (!item) return;

    if (cantidad > item.stock_actual) {
      alert(`La cantidad no puede superar el stock disponible (${item.stock_actual}).`);
      return;
    }

    if (cantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    setCarrito(
      carrito.map((i) => (i.id === id ? { ...i, cantidadVenta: cantidad, subtotal: cantidad * i.precio } : i))
    );
  };

  const eliminarDelCarrito = (id: number) => {
    setCarrito(carrito.filter((i) => i.id !== id));
  };

  const totalVenta = carrito.reduce((acc, i) => acc + i.subtotal, 0);

  const handleConfirmar = async () => {
    if (carrito.length === 0) return;
    setProcesando(true);
    setExitoMsg('');

    const motivoFinal = motivo === 'Otro' ? `Otro: ${motivoOtro}` : motivo;

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
        setExitoMsg(`Operación realizada con éxito. Código de seguimiento: ${data.codigo_seguimiento}`);
        setCarrito([]);
        setMotivoOtro('');
        cargarProductos();
      } else {
        alert(data.error || 'Error procesando la operación');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setProcesando(false);
    }
  };

  const filtrados = productos.filter(
    (p) =>
      (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans space-y-6">
      <header className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-3">
          <ShoppingCartIcon className="w-8 h-8 text-[#E50914]" /> Registrar Venta o Salida
        </h1>
        <p className="text-xs text-slate-400">Descuenta existencias por venta, uso interno u otros motivos</p>
      </header>

      {exitoMsg && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 shrink-0" /> {exitoMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Selección de Productos */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
            {filtrados.map((p) => (
              <div
                key={p.id}
                onClick={() => agregarAlCarrito(p)}
                className="bg-[#0f0f0f] border border-white/10 hover:border-[#E50914] p-4 rounded-2xl cursor-pointer transition-all space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-slate-500">{p.codigo || `ID-${p.id}`}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-slate-300">
                    Stock: {p.stock_actual}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{p.nombre}</h4>
                <p className="text-emerald-400 font-mono font-bold text-xs">${Number(p.precio).toLocaleString('es-CO')} COP</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen de Venta / Carrito */}
        <div className="lg:col-span-5 bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-black italic border-b border-white/10 pb-3">Resumen de Operación</h3>

            {carrito.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-8">Selecciona productos de la lista para agregar</p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {carrito.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <p className="font-bold text-xs">{item.nombre}</p>
                      <p className="text-[10px] text-emerald-400 font-mono">${item.precio.toLocaleString('es-CO')} COP</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={item.stock_actual}
                        value={item.cantidadVenta}
                        onChange={(e) => cambiarCantidad(item.id, Number(e.target.value))}
                        className="w-14 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-center font-mono text-xs text-white"
                      />
                      <button onClick={() => eliminarDelCarrito(item.id)} className="text-red-400 hover:text-red-300">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Motivo de Salida */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-xs font-bold text-slate-400 uppercase">Motivo de Salida</label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Venta">Venta (Suma a ingresos)</option>
                <option value="Uso interno">Uso interno (No suma ingresos)</option>
                <option value="Otro">Otro motivo</option>
              </select>

              {motivo === 'Otro' && (
                <input
                  type="text"
                  placeholder="Escribe el motivo brevemente..."
                  value={motivoOtro}
                  onChange={(e) => setMotivoOtro(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center text-sm font-bold">
              <span>Total Operación:</span>
              <span className="text-xl font-mono text-emerald-400 font-black">${totalVenta.toLocaleString('es-CO')} COP</span>
            </div>

            <button
              onClick={handleConfirmar}
              disabled={carrito.length === 0 || procesando}
              className="w-full bg-[#E50914] hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              {procesando ? 'Procesando...' : motivo === 'Venta' ? 'Confirmar Venta' : 'Confirmar Salida'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}