'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChartBarIcon, 
  ArrowDownTrayIcon, 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  TrophyIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  BoltIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface ItemPedido {
  nombre: string;
  cantidad: number;
  precio: number;
}

interface Pedido {
  id: number;
  cliente_nombre: string;
  metodo_pago: string;
  total: number | string;
  estado: string;
  fecha?: string;
  fecha_milisegundos?: number | string;
  items: string | ItemPedido[];
}

type FiltroTiempo = 'hoy' | 'semana' | 'mes' | 'semestre' | 'todo';

export default function ReportesView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('hoy'); // Por defecto iniciamos en 'hoy' para mayor inmediatez operativa

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await fetch(`/api/pedidos?t=${new Date().getTime()}`, { 
          cache: 'no-store' 
        });
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const pedidosCompletados = data.filter(p => 
            p.estado && p.estado.trim().toLowerCase() === 'completado'
          );
          setPedidos(pedidosCompletados);
        }
      } catch (error) {
        console.error("Error crítico al cargar datos para reportes:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerDatos();
  }, []);

  // 1. FILTRADO POR TIEMPO ESPECÍFICO
  const pedidosAnalizar = useMemo(() => {
    const ahora = new Date();
    
    return pedidos.filter(p => {
      let fechaPedido: Date | null = null;
      
      try {
        if (p.fecha_milisegundos) {
          fechaPedido = new Date(Number(p.fecha_milisegundos));
        } else if (p.fecha) {
          fechaPedido = new Date(String(p.fecha).replace(' ', 'T'));
        }
      } catch (e) {
        console.warn("Fallo al parsear fecha en pedido ID:", p.id);
      }

      if (!fechaPedido || isNaN(fechaPedido.getTime())) return false;

      switch (filtroTiempo) {
        case 'hoy':
          return (
            fechaPedido.getDate() === ahora.getDate() &&
            fechaPedido.getMonth() === ahora.getMonth() &&
            fechaPedido.getFullYear() === ahora.getFullYear()
          );
        case 'semana':
          const hace7Dias = new Date();
          hace7Dias.setDate(ahora.getDate() - 7);
          hace7Dias.setHours(0,0,0,0);
          return fechaPedido >= hace7Dias;
        case 'mes':
          return fechaPedido.getMonth() === ahora.getMonth() && fechaPedido.getFullYear() === ahora.getFullYear();
        case 'semestre':
          const hace6Meses = new Date();
          hace6Meses.setMonth(ahora.getMonth() - 6);
          hace6Meses.setHours(0,0,0,0);
          return fechaPedido >= hace6Meses;
        case 'todo':
        default:
          return true;
      }
    });
  }, [pedidos, filtroTiempo]);

  // 2. CÁLCULOS ESTADÍSTICOS
  const metricas = useMemo(() => {
    if (pedidosAnalizar.length === 0) {
      return { totalIngresos: 0, totalPedidos: 0, ticketPromedio: 0, topProducto: 'Sin datos en este periodo', horaPico: 'Sin datos' };
    }

    let totalIngresos = 0;
    const conteoProductos: Record<string, number> = {};
    const conteoHoras: Record<number, number> = {};

    pedidosAnalizar.forEach(p => {
      totalIngresos += Number(p.total || 0);

      let items: ItemPedido[] = [];
      if (Array.isArray(p.items)) {
         items = p.items;
      } else if (typeof p.items === 'string') {
         try { items = JSON.parse(p.items); } catch (e) {}
      }
      
      items.forEach(it => {
        if (!it || !it.nombre) return;
        conteoProductos[it.nombre] = (conteoProductos[it.nombre] || 0) + Number(it.cantidad || 1);
      });

      let hora = -1;
      try {
        if (p.fecha_milisegundos) hora = new Date(Number(p.fecha_milisegundos)).getHours();
        else if (p.fecha) hora = new Date(String(p.fecha).replace(' ', 'T')).getHours();
      } catch (e) {}
      
      if (hora >= 0 && !isNaN(hora)) conteoHoras[hora] = (conteoHoras[hora] || 0) + 1;
    });

    let topProducto = 'N/A';
    if (Object.keys(conteoProductos).length > 0) {
       const top = Object.entries(conteoProductos).reduce((a, b) => a[1] > b[1] ? a : b);
       topProducto = `${top[0]} (${top[1]} und)`;
    }

    let horaPico = 'N/A';
    if (Object.keys(conteoHoras).length > 0) {
       const pico = Object.entries(conteoHoras).reduce((a, b) => a[1] > b[1] ? a : b);
       const horaFormato = parseInt(pico[0]);
       const ampm = horaFormato >= 12 ? 'PM' : 'AM';
       const hora12 = horaFormato % 12 || 12;
       horaPico = `${hora12}:00 ${ampm} (${pico[1]} ped.)`;
    }

    const ticketPromedio = totalIngresos / pedidosAnalizar.length;

    return { totalIngresos, totalPedidos: pedidosAnalizar.length, ticketPromedio, topProducto, horaPico };
  }, [pedidosAnalizar]);

  // 3. EXPORTACIÓN A CSV ESPECÍFICA
  const exportarCSV = useCallback(() => {
    if (pedidosAnalizar.length === 0) return;

    let csv = "ID Pedido;Fecha y Hora;Cliente;Metodo Pago;Total Ingreso\n";

    pedidosAnalizar.forEach(p => {
      let fechaFormat = 'N/A';
      try {
        if (p.fecha_milisegundos) fechaFormat = new Date(Number(p.fecha_milisegundos)).toLocaleString('es-CO');
        else if (p.fecha) fechaFormat = new Date(String(p.fecha).replace(' ', 'T')).toLocaleString('es-CO');
      } catch(e) {}

      const clienteLimpio = (p.cliente_nombre || 'Cliente Genérico').replace(/;/g, ',').replace(/"/g, '');
      const metodoPagoLimpio = (p.metodo_pago || 'N/A').replace(/;/g, ',');
      
      csv += `${p.id};"${fechaFormat}";"${clienteLimpio}";${metodoPagoLimpio};${Number(p.total)}\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const fechaStr = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    link.download = `Reporte_${filtroTiempo.toUpperCase()}_MrKings_${fechaStr}.csv`;
    
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500); 
  }, [pedidosAnalizar, filtroTiempo]);

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin h-12 w-12 border-4 border-[#E50914] border-t-transparent rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* CABECERA Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black italic mb-2 tracking-tight flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-[#E50914]" /> Reportes Analíticos
          </h2>
          <div className="text-slate-400 text-xs uppercase tracking-widest font-bold">
            {filtroTiempo === 'hoy' ? (
              <span className="flex items-center gap-1">
                <SignalIcon className="w-4 h-4 text-red-500" /> Modo Operativo en Vivo: Jornada de Hoy
              </span>
            ) : (
              'Inteligencia de Negocio y Cierres Contables'
            )}
          </div>
        </div>
        
        <div className="bg-[#111] p-1.5 rounded-xl border border-white/10 flex flex-wrap gap-1 shadow-inner">
           {(['hoy', 'semana', 'mes', 'semestre', 'todo'] as FiltroTiempo[]).map((filtro) => (
               <button 
                  key={filtro}
                  onClick={() => setFiltroTiempo(filtro)} 
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    filtroTiempo === filtro 
                      ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.4)] scale-[1.02]' 
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
               >
                  {filtro === 'hoy' ? (
                    <span className="flex items-center gap-1 justify-center">
                      <BoltIcon className="w-4 h-4" /> Hoy
                    </span>
                  ) : filtro === 'todo' ? 'Histórico' : filtro === 'mes' ? 'Este Mes' : filtro === 'semestre' ? '6 Meses' : filtro}
               </button>
           ))}
        </div>
      </div>

      {/* AVISO SI NO HAY DATOS EN HOY */}
      {pedidosAnalizar.length === 0 && (
        <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-8 flex items-center gap-4 animate-in slide-in-from-top-4">
          <ExclamationTriangleIcon className="w-6 h-6 shrink-0 text-red-500" />
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm">Sin actividad registrada para hoy</h4>
            <p className="text-xs font-medium text-red-300/80 mt-0.5">Todavía no hay órdenes completadas en la jornada de hoy. El panel se actualizará automáticamente.</p>
          </div>
        </div>
      )}

      {/* TARJETAS DE MÉTRICAS ESPECÍFICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#0f0f0f]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-green-500/30 transition-all shadow-xl">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full flex items-start justify-end p-3 pointer-events-none group-hover:bg-green-500/20 transition-all duration-500">
            <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 relative z-10">
            {filtroTiempo === 'hoy' ? 'Ingresos de Hoy' : 'Ingresos Totales'}
          </p>
          <h3 className="text-3xl lg:text-4xl font-black text-green-400 mb-2 relative z-10 font-mono tracking-tighter">${metricas.totalIngresos.toLocaleString('es-CO')}</h3>
          <p className="text-xs text-slate-400 font-bold relative z-10 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${metricas.totalPedidos > 0 ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></span> 
            {metricas.totalPedidos} órdenes procesadas
          </p>
        </div>

        <div className="bg-[#0f0f0f]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full flex items-start justify-end p-3 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500">
            <CreditCardIcon className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 relative z-10">Ticket Promedio</p>
          <h3 className="text-3xl lg:text-4xl font-black text-blue-400 mb-2 relative z-10 font-mono tracking-tighter">${Math.round(metricas.ticketPromedio).toLocaleString('es-CO')}</h3>
          <p className="text-xs text-slate-400 font-bold relative z-10">Gasto medio por cliente</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a0505] to-[#0f0f0f] p-6 rounded-3xl border border-[#E50914]/30 relative overflow-hidden shadow-[0_0_30px_rgba(229,9,20,0.1)] group hover:shadow-[0_0_40px_rgba(229,9,20,0.2)] transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#E50914]/10 rounded-bl-full flex items-start justify-end p-3 pointer-events-none group-hover:bg-[#E50914]/20 transition-all duration-500">
            <TrophyIcon className="w-6 h-6 text-[#E50914]" />
          </div>
          <p className="text-[10px] text-[#E50914] font-black uppercase tracking-widest mb-1 relative z-10">Producto Estrella</p>
          <h3 className="text-xl font-black text-white mb-2 leading-tight min-h-[3rem] flex items-center relative z-10">{metricas.topProducto}</h3>
          <p className="text-xs text-slate-400 font-bold relative z-10">Líder en ventas del periodo</p>
        </div>

        <div className="bg-[#0f0f0f]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-xl">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full flex items-start justify-end p-3 pointer-events-none group-hover:bg-orange-500/20 transition-all duration-500">
            <ClockIcon className="w-6 h-6 text-orange-400" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 relative z-10">Horario Pico</p>
          <h3 className="text-xl font-black text-white mb-2 leading-tight min-h-[3rem] flex items-center relative z-10">{metricas.horaPico}</h3>
          <p className="text-xs text-slate-400 font-bold relative z-10">Mayor flujo de transacciones</p>
        </div>
      </div>

      {/* SECCIÓN DE EXPORTACIÓN */}
      <div className="bg-[#0a0a0a] p-8 md:p-12 rounded-[2.5rem] border border-white/5 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#E50914] rounded-full blur-[120px] opacity-10 pointer-events-none transition-opacity duration-1000" />
        
        <ArrowDownTrayIcon className="w-10 h-10 text-[#E50914] mb-4 relative z-10 drop-shadow-lg" />
        
        <h3 className="font-black text-2xl lg:text-3xl mb-3 relative z-10 tracking-tight">Exportar Balance de {filtroTiempo.toUpperCase()}</h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8 font-bold relative z-10">
          Descarga un reporte en Excel estructurado con los <strong className="text-white bg-white/10 px-2 py-0.5 rounded-md">{metricas.totalPedidos} pedidos</strong> filtrados para este corte temporal.
        </p>
        
        <button 
          onClick={exportarCSV} 
          disabled={pedidosAnalizar.length === 0}
          className="bg-gradient-to-r from-red-800 to-[#E50914] hover:from-red-700 hover:to-red-600 disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-slate-500 text-white font-black px-8 py-4 rounded-xl text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_10px_30px_rgba(229,9,20,0.3)] hover:shadow-[0_10px_40px_rgba(229,9,20,0.5)] disabled:shadow-none hover:-translate-y-1 active:scale-95 flex items-center gap-2 relative z-10 focus:outline-none focus:ring-4 focus:ring-red-900"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {pedidosAnalizar.length === 0 ? 'Sin datos para este periodo' : `Descargar Reporte_${filtroTiempo.toUpperCase()}.CSV`}
        </button>
      </div>
      
    </div>
  );
}