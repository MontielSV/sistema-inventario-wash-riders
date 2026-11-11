'use client';
import { useState, useEffect } from 'react';
import { 
  LockClosedIcon,
  FireIcon,
  CheckCircleIcon,
  InboxIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
  PaperAirplaneIcon,
  PrinterIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

// 1. TIPADO EMPRESARIAL: Sinergia con la Base de Datos
export interface ItemPedido {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface Pedido {
  id: number;
  cliente_nombre: string;
  metodo_pago: string;
  total: number | string;
  estado: 'Pendiente' | 'Completado' | string;
  fecha?: string;
  fecha_milisegundos?: number | string;
  items: string | ItemPedido[];
  notas?: string;
  caja_cerrada?: boolean;
}

export default function VentasView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestanaActiva, setPestanaActiva] = useState<'pendientes' | 'historial'>('pendientes');
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para prevenir doble clics (Race conditions)
  const [procesandoIds, setProcesandoIds] = useState<Set<number>>(new Set());
  
  // El motor del reloj que actualizará la barra cada segundo
  const [tiempoActual, setTiempoActual] = useState(Date.now());

  const obtenerPedidos = async () => {
    try {
      const res = await fetch('/api/pedidos', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setPedidos(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setCargando(false);
    }
  };

  // Polling a la base de datos (cada 4 segundos)
  useEffect(() => {
    obtenerPedidos();
    const intervaloDb = setInterval(obtenerPedidos, 4000);
    return () => clearInterval(intervaloDb);
  }, []);

  // Reloj de alta precisión para que la barra fluya cada segundo
  useEffect(() => {
    const motorReloj = setInterval(() => setTiempoActual(Date.now()), 1000);
    return () => clearInterval(motorReloj);
  }, []);

  // Cálculo de tiempo para la barra de progreso
  const calcularTiempo = (pedido: Pedido) => {
    let timestamp = 0;
    if (pedido.fecha_milisegundos) {
      timestamp = Number(pedido.fecha_milisegundos);
    } else if (pedido.fecha) {
      timestamp = new Date(String(pedido.fecha).replace(' ', 'T')).getTime();
    }
    
    if (isNaN(timestamp) || timestamp === 0) return { minutos: 0, porcentaje: 0 };

    const segundosTranscurridos = Math.max(0, Math.floor((tiempoActual - timestamp) / 1000));
    const minutos = Math.floor(segundosTranscurridos / 60);
    const porcentaje = Math.min((segundosTranscurridos / 1200) * 100, 100);

    return { minutos, porcentaje };
  };

  const formatearFechaYHora = (pedido: Pedido) => {
    try {
      let fechaObj: Date;
      if (pedido.fecha_milisegundos) {
        fechaObj = new Date(Number(pedido.fecha_milisegundos));
      } else if (pedido.fecha) {
        fechaObj = new Date(String(pedido.fecha).replace(' ', 'T'));
      } else {
        return 'Hora desconocida';
      }
      
      if (isNaN(fechaObj.getTime())) return 'Hora inválida';
      
      const fecha = fechaObj.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      const hora = fechaObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${fecha} - ${hora}`;
    } catch (e) {
      return '';
    }
  };

  // Prevención de doble clic
  const cambiarEstado = async (id: number, estadoActual: string) => {
    if (procesandoIds.has(id)) return;

    const nuevo = estadoActual === 'Pendiente' ? 'Completado' : 'Pendiente';
    
    setProcesandoIds(prev => new Set(prev).add(id));
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevo } : p));
    
    try {
      const res = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevo })
      });
      if (!res.ok) throw new Error("Fallo en BD");
    } catch (e) { 
      obtenerPedidos(); 
    } finally {
      setProcesandoIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // CIERRE DE CAJA PROFESIONAL (Descarga reporte antes de vaciar)
  const realizarCierreDeCaja = async () => {
    const completadosTurnoActual = pedidosDelDia.filter(p => p.estado === 'Completado' && !p.caja_cerrada);

    if (completadosTurnoActual.length === 0) {
      alert("No hay pedidos completados pendientes de cierre en el turno actual.\n(Si ya cerraste caja anteriormente, el arqueo de este turno está al día).");
      return;
    }
    
    const confirmacion = window.confirm(
      `[ATENCIÓN] ARQUEO DE CIERRE DE CAJA\n\n` +
      `Pedidos a procesar en este turno: ${completadosTurnoActual.length}\n` +
      `Total en caja a arquear: $${totalTurnoActual.toLocaleString('es-CO')}\n\n` +
      `¿Deseas descargar el reporte de cierre y archivar el turno actual?\n(Tus estadísticas anuales y el Dashboard se mantendrán intactos).`
    );
    
    if (!confirmacion) return;

    try {
      // 1. Generar CSV de respaldo automático antes de borrar
      if (completadosTurnoActual.length > 0) {
        let csv = "ID Pedido;Fecha;Cliente;Metodo Pago;Total Ingreso\n";
        completadosTurnoActual.forEach(p => {
          let fechaFormat = 'N/A';
          try {
            if (p.fecha_milisegundos) fechaFormat = new Date(Number(p.fecha_milisegundos)).toLocaleString('es-CO');
          } catch(e) {}
          const clienteLimpio = (p.cliente_nombre || 'Cliente').replace(/;/g, ',');
          csv += `${p.id};"${fechaFormat}";"${clienteLimpio}";${p.metodo_pago};${Number(p.total)}\n`;
        });

        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Cierre_Caja_MrKings_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // 2. Petición para archivar el turno en la base de datos sin borrar registros
      const res = await fetch('/api/pedidos', { method: 'DELETE' });
      if (res.ok) {
        alert("¡Cierre de caja exitoso!\n\nReporte descargado y turno archivado. El contador de caja se reinició para el nuevo turno mientras el historial y el Dashboard se preservan al 100%.");
        obtenerPedidos();
      } else {
        alert("Error al sincronizar el cierre de caja con el servidor.");
      }
    } catch (error) {
      console.error("Error en cierre de caja:", error);
      alert("Error de red al intentar el cierre.");
    }
  };

  // IMPRESIÓN OPTIMIZADA PARA IMPRESORAS TÉRMICAS (CSS ESPECÍFICO)
  const imprimirFactura = (pedido: Pedido) => {
    const anchoImpresora = '58mm'; // Cambiar a 80mm si usan impresora grande de caja

    const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
    if (ventanaImpresion) {
      let listaItems: ItemPedido[] = [];
      try { listaItems = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items || []); } catch (e) {}

      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Factura #${pedido.id}</title>
            <style>
              /* REGLAS ESTRICTAS PARA IMPRESORAS TÉRMICAS */
              @page { margin: 0; size: auto; } /* Quita márgenes y URLs del navegador */
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                width: ${anchoImpresora === '58mm' ? '48mm' : '72mm'}; /* Área real imprimible */
                margin: 0 auto; 
                padding: 10px 0; 
                color: #000; 
              }
              h2, h3 { text-align: center; margin: 2px 0; font-size: 16px; text-transform: uppercase; }
              .line { border-bottom: 1px dashed #000; margin: 8px 0; }
              .centro { text-align: center; }
              ul { padding-left: 0; list-style: none; margin: 8px 0; }
              li { display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: bold; }
              .item-nombre { flex: 1; margin-left: 5px; text-transform: uppercase; font-size: 11px; }
              .total-caja { font-size: 18px; font-weight: 900; text-align: center; margin-top: 10px; }
            </style>
          </head>
          <body>
            <h2>WASH RIDERS</h2>
            <div class="centro">CONTROL DE INVENTARIO</div>
            <div class="line"></div>
            <p style="margin: 3px 0;"><b>ORDEN:</b> #${pedido.id}</p>
            <p style="margin: 3px 0;"><b>FECHA:</b> ${formatearFechaYHora(pedido)}</p>
            <p style="margin: 3px 0;"><b>CLIENTE:</b> ${pedido.cliente_nombre}</p>
            <p style="margin: 3px 0;"><b>PAGO:</b> ${pedido.metodo_pago}</p>
            <div class="line"></div>
            <ul>
              ${listaItems.map((i) => `
                <li>
                  <span>${i.cantidad}x</span> 
                  <span class="item-nombre">${i.nombre}</span> <span>$${(i.precio * i.cantidad).toLocaleString('es-CO')}</span>
                </li>`).join('')}
            </ul>
            <div class="line"></div>
            <div class="total-caja">TOTAL: $${Number(pedido.total || 0).toLocaleString('es-CO')}</div>
            <div class="line"></div>
            <div class="centro"><br/>¡Gracias por tu compra! <br/>.</div>
            <script>
              window.onload = function() { 
                window.print(); 
                // Cierra la pestaña después de imprimir para no llenar el navegador
                setTimeout(() => window.close(), 1000); 
              }
            </script>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    }
  };

  const imprimirComandaCocina = (pedido: Pedido) => {
    const anchoImpresora = '58mm';
    
    const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
    if (ventanaImpresion) {
      let listaItems: ItemPedido[] = [];
      try { listaItems = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items || []); } catch (e) {}

      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Comanda #${pedido.id}</title>
            <style>
              @page { margin: 0; size: auto; }
              body { 
                font-family: Arial, sans-serif; 
                width: ${anchoImpresora === '58mm' ? '48mm' : '72mm'}; 
                margin: 0 auto; 
                padding: 10px 0; 
                color: #000; 
              }
              h1 { text-align: center; margin: 0; font-size: 24px; font-weight: 900; background: #000; color: #fff; padding: 5px; }
              .line { border-bottom: 2px solid #000; margin: 10px 0; }
              ul { padding-left: 0; list-style: none; margin: 10px 0; }
              li { margin-bottom: 12px; font-size: 16px; font-weight: 900; border-bottom: 1px dashed #ccc; padding-bottom: 5px; display: flex; align-items: center;}
              .cantidad { font-size: 20px; font-weight: 900; border: 2px solid #000; padding: 2px 6px; border-radius: 4px; margin-right: 8px; }
              .notas { font-size: 14px; font-weight: 900; text-transform: uppercase; border: 2px dashed #000; padding: 10px; margin-top: 10px; display: block; }
            </style>
          </head>
          <body>
            <div style="text-align: center; font-weight: bold; margin-bottom: 5px;">COMANDA DE COCINA</div>
            <h1>#${pedido.id}</h1>
            <p style="font-size: 12px; margin: 5px 0;"><b>PARA:</b> ${pedido.cliente_nombre}</p>
            <p style="font-size: 12px; margin: 5px 0;"><b>HORA:</b> ${formatearFechaYHora(pedido)}</p>
            <div class="line"></div>
            <ul>
              ${listaItems.map((i) => `<li><span class="cantidad">${i.cantidad}</span>${i.nombre}</li>`).join('')}
            </ul>
            ${pedido.notas ? `<div class="notas">[ATENCIÓN]:<br/>${pedido.notas}</div>` : ''}
            <div class="line" style="margin-top: 30px;"></div>
            <div style="text-align:center;">.</div>
            <script>
              window.onload = function() { 
                window.print(); 
                setTimeout(() => window.close(), 1000); 
              }
            </script>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    }
  };

  const ahora = new Date();

  const pedidosDelDia = pedidos.filter(p => {
    let fechaPedido: Date;
    if (p.fecha_milisegundos) {
      fechaPedido = new Date(Number(p.fecha_milisegundos));
    } else if (p.fecha) {
      fechaPedido = new Date(p.fecha);
    } else {
      return false;
    }
    if (isNaN(fechaPedido.getTime())) return false;
    return (
      fechaPedido.getDate() === ahora.getDate() &&
      fechaPedido.getMonth() === ahora.getMonth() &&
      fechaPedido.getFullYear() === ahora.getFullYear()
    );
  });

  const pedidosFiltrados = pedidosDelDia.filter(p => {
    if (pestanaActiva === 'pendientes' && p.estado === 'Completado') return false;
    if (pestanaActiva === 'historial' && p.estado !== 'Completado') return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (p.cliente_nombre || '').toLowerCase().includes(q) || String(p.id).includes(q);
    }
    return true;
  });

  // Arqueo del turno abierto actual (pedidos completados que aún no se han cerrado)
  const totalTurnoActual = pedidosDelDia
    .filter(p => p.estado === 'Completado' && !p.caja_cerrada)
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  // Total acumulado del día
  const totalCajaHoy = totalTurnoActual;
  const totalDiaAcumulado = pedidosDelDia
    .filter(p => p.estado === 'Completado')
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  return (
    <div className="w-full h-full min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#111] p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#E50914]"></div>
        <div>
          <span className="text-[10px] font-black uppercase text-[#E50914] tracking-widest mb-2 block">
            Kitchen Display System KDS
          </span>
          <h1 className="text-3xl lg:text-4xl font-black italic tracking-tight text-rose-800">Caja Diaria</h1>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={realizarCierreDeCaja}
            className="bg-zinc-800 hover:bg-red-950 text-red-400 border border-red-500/30 font-black px-5 py-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 active:scale-95"
          >
            <LockClosedIcon className="w-4 h-4" /> Cierre de Caja & Reporte
          </button>

          <div className="bg-black border border-[#E50914]/30 px-8 py-4 rounded-2xl flex flex-col items-end shadow-[0_0_20px_rgba(229,9,20,0.1)]">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Turno Actual
            </span>
            <span className="text-[#E50914] text-3xl font-black">${totalTurnoActual.toLocaleString('es-CO')}</span>
            {totalDiaAcumulado > totalTurnoActual && (
              <span className="text-[10px] text-slate-500 font-bold mt-0.5">Total hoy: ${totalDiaAcumulado.toLocaleString('es-CO')}</span>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#111] p-3 rounded-2xl border border-white/5 mb-8">
        <div className="flex w-full md:w-auto gap-2">
          <button 
            onClick={() => setPestanaActiva('pendientes')} 
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              pestanaActiva === 'pendientes' ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/50' : 'bg-black text-slate-500 hover:text-white'
            }`}
          >
            <FireIcon className="w-4 h-4" /> Activos en Cocina
          </button>
          <button 
            onClick={() => setPestanaActiva('historial')} 
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              pestanaActiva === 'historial' ? 'bg-zinc-800 text-white shadow-lg' : 'bg-black text-slate-500 hover:text-white'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" /> Completados Hoy
          </button>
        </div>
        <input 
          type="text" 
          placeholder=" Buscar orden o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-80 bg-black text-white px-5 py-3 rounded-xl border border-white/10 focus:border-[#E50914] text-sm outline-none transition-all"
        />
      </div>

      {/* TARJETAS DE PEDIDOS */}
      {cargando ? (
        <div className="flex justify-center items-center py-20 text-[#E50914] animate-pulse font-black text-xl">
          Cargando pedidos...
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#111] border border-white/5 rounded-3xl opacity-60">
          {/* Ícono reducido a un tamaño más refinado (w-12 h-12) */}
          <InboxIcon className="w-12 h-12 mb-3 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-400">No hay pedidos para mostrar</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosFiltrados.map((o) => {
            const { minutos, porcentaje } = calcularTiempo(o);
            const critico = minutos >= 15 && o.estado !== 'Completado';
            const procesando = procesandoIds.has(o.id);

            let items: ItemPedido[] = [];
            try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch(e){}

            // Extraemos la hora para renderizar en el badge
            const horaBadge = formatearFechaYHora(o).includes(' - ') 
              ? formatearFechaYHora(o).split(' - ')[1] 
              : formatearFechaYHora(o);

            return (
              <div key={o.id} className={`bg-[#111] rounded-3xl p-5 border flex flex-col transition-all duration-300 ${
                critico ? 'border-[#E50914] shadow-[0_0_30px_rgba(229,9,20,0.2)]' : 'border-white/5 hover:border-white/20'
              } ${procesando ? 'opacity-50 pointer-events-none' : ''}`}>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                      critico ? 'bg-[#E50914] text-white animate-pulse' : 'bg-black text-[#E50914] border border-white/10'
                    }`}>
                      #{o.id}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white truncate max-w-[140px]">{o.cliente_nombre}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-[10px] bg-zinc-900 text-slate-300 px-2 py-1 rounded border border-white/10">
                          {o.metodo_pago}
                        </span>
                        <span className="text-[10px] bg-zinc-900 text-emerald-400 font-bold px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" /> {horaBadge}
                        </span>
                        {o.caja_cerrada && (
                          <span className="text-[10px] bg-zinc-900 text-yellow-500 font-bold px-2 py-1 rounded border border-yellow-500/20 flex items-center gap-1" title="Pedido ya archivado en cierre previo">
                            <LockClosedIcon className="w-3 h-3" /> Turno Cerrado
                          </span>
                        )}
                        <span style={{ display: 'none' }}>
                        </span>
                      </div>
                    </div>
                  </div>
                  <h4 className="font-black text-xl text-white ml-2">${Number(o.total).toLocaleString('es-CO')}</h4>
                </div>

                {o.estado !== 'Completado' && (
                  <div className="mb-4 bg-black/50 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiempo de preparación:</span>
                      <span className={`text-sm font-black ${critico ? 'text-[#E50914]' : 'text-emerald-400'}`}>
                        {minutos} min
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-linear ${critico ? 'bg-[#E50914]' : 'bg-emerald-400'}`} 
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-black p-4 rounded-2xl flex-1 mb-5 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3 border-b border-white/5 pb-2">Preparar</p>
                  <div className="space-y-3">
                    {items.map((it, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3 text-slate-300">
                          <span className="bg-[#E50914] text-white font-black px-2.5 py-1 rounded text-xs">{it.cantidad}</span>
                          <span className="font-bold text-[15px]">{it.nombre}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {o.notas && (
                    <div className="mt-4 bg-yellow-950/20 border border-yellow-500/20 p-3 rounded-xl flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 shrink-0" />
                      <p className="text-sm text-yellow-500 font-black">{o.notas}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button 
                    disabled={procesando}
                    onClick={() => cambiarEstado(o.id, o.estado)}
                    className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-transform active:scale-95 flex justify-center items-center gap-2 ${
                      o.estado === 'Completado' 
                        ? 'bg-zinc-800 text-slate-400 hover:bg-zinc-700' 
                        : 'bg-[#E50914] text-white hover:bg-red-700'
                    }`}
                  >
                    {procesando ? (
                       <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : o.estado === 'Completado' ? (
                       <><ArrowUturnLeftIcon className="w-4 h-4" /> Deshacer</>
                    ) : (
                       <><PaperAirplaneIcon className="w-4 h-4" /> Despachar</>
                    )}
                  </button>
                  
                  <button 
                    disabled={procesando}
                    onClick={() => imprimirFactura(o)}
                    className="w-12 bg-black border border-white/10 rounded-xl flex justify-center items-center hover:bg-white/10 transition-colors active:scale-95 text-slate-300 hover:text-white"
                    title="Imprimir Factura"
                  >
                    <PrinterIcon className="w-5 h-5" />
                  </button>
                  <button 
                    disabled={procesando}
                    onClick={() => imprimirComandaCocina(o)}
                    className="w-12 bg-black border border-white/10 rounded-xl flex justify-center items-center hover:bg-white/10 transition-colors active:scale-95 text-slate-300 hover:text-white"
                    title="Imprimir Comanda Cocina"
                  >
                    <ClipboardDocumentListIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}