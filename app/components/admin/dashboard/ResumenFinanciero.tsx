'use client';

import { 
  ArrowTrendingUpIcon, 
  ChartBarIcon, 
  CalendarIcon, 
  TagIcon 
} from '@heroicons/react/24/outline';

interface TarjetaProps {
  titulo: string;
  valor: number;
  subtitulo: string;
  tendencia?: number;
  destacado?: boolean;
  claveAccion: string;
  icono: React.ReactNode;
  onClick: () => void;
}

const Tarjeta = ({ titulo, valor, subtitulo, tendencia, destacado, icono, onClick }: TarjetaProps) => (
  <button 
    onClick={onClick}
    aria-label={`Ver detalles de ${titulo}`}
    className={`w-full text-left backdrop-blur-3xl backdrop-saturate-150 border p-7 rounded-[2.5rem] shadow-2xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:ring-offset-2 focus:ring-offset-[#0f0f0f] cursor-pointer group relative overflow-hidden ${
      destacado 
        ? 'bg-gradient-to-br from-[#1a0505] to-[#0f0f0f] border-red-500/40 shadow-[0_10px_40px_rgba(229,9,20,0.2)]' 
        : 'bg-[#0f0f0f]/80 border-white/10 hover:border-[#E50914]/50'
    }`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-red-600/20 transition-all duration-700 ease-out" />
    <div className="relative z-10 w-full">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{titulo}</span>
        <div className="w-8 h-8 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xs text-slate-300 group-hover:bg-[#E50914] group-hover:text-white group-hover:border-red-500 transition-colors shadow-inner">
          {icono}
        </div>
      </div>
      <p className={`text-3xl md:text-4xl font-black tracking-tight font-mono ${destacado ? 'text-emerald-400' : 'text-white'}`}>
        ${valor.toLocaleString('es-CO')}
      </p>
    </div>
    
    <div className="relative z-10 w-full mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-300 transition-colors">{subtitulo}</span>
      {tendencia !== undefined && (
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm border transition-colors ${
          tendencia > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/30' : 
          tendencia < 0 ? 'bg-red-500/20 text-red-400 border-red-500/30 group-hover:bg-red-500/30' : 'bg-zinc-800 text-slate-300 border-white/10'
        }`}>
          {tendencia > 0 ? '↑' : tendencia < 0 ? '↓' : '•'} {Math.abs(tendencia).toFixed(1)}% vs ayer
        </span>
      )}
    </div>
  </button>
);

interface FinanzasData {
  ventasHoy?: number;
  ventasSemana?: number;
  ventasMes?: number;
  ticketPromedio?: number;
  crecimientoHoy?: number;
}

interface ResumenFinancieroProps {
  data?: FinanzasData | null;
  onNavegar?: (seccion: string) => void;
}

export default function ResumenFinanciero({ data = {}, onNavegar }: ResumenFinancieroProps) {
  const { 
    ventasHoy = 0, 
    ventasSemana = 0, 
    ventasMes = 0, 
    ticketPromedio = 0, 
    crecimientoHoy = 0 
  } = data || {};

  const handleNav = (seccion: string) => {
    if (onNavegar) onNavegar(seccion);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tarjeta 
        titulo="Ventas de Hoy" 
        valor={ventasHoy} 
        subtitulo="Ver detalle diario ➔" 
        tendencia={crecimientoHoy} 
        destacado={true} 
        claveAccion="hoy" 
        icono={<ArrowTrendingUpIcon className="w-5 h-5" />} 
        onClick={() => handleNav('hoy')} 
      />
      <Tarjeta 
        titulo="Ventas 7 Días" 
        valor={ventasSemana} 
        subtitulo="Ver acumulado ➔" 
        claveAccion="semana" 
        icono={<ChartBarIcon className="w-5 h-5" />} 
        onClick={() => handleNav('semana')} 
      />
      <Tarjeta 
        titulo="Mes Actual" 
        valor={ventasMes} 
        subtitulo="Ver histórico ➔" 
        claveAccion="mes" 
        icono={<CalendarIcon className="w-5 h-5" />} 
        onClick={() => handleNav('mes')} 
      />
      <Tarjeta 
        titulo="Ticket Promedio" 
        valor={ticketPromedio} 
        subtitulo="Análisis de orden ➔" 
        claveAccion="ticket" 
        icono={<TagIcon className="w-5 h-5" />} 
        onClick={() => handleNav('ticket')} 
      />
    </div>
  );
}