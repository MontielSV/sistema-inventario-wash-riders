'use client';

import { PresentationChartLineIcon } from '@heroicons/react/24/outline';

interface GraficosVentasProps {
  datosPorHora?: number[] | null;
}

export default function GraficosVentas({ datosPorHora = [] }: GraficosVentasProps) {
  const safeDatos = Array.isArray(datosPorHora) && datosPorHora.length === 24 ? datosPorHora : Array(24).fill(0);
  
  const picoMaximo = Math.max(...safeDatos, 0);
  const totalDia = safeDatos.reduce((acc, val) => acc + Number(val || 0), 0);

  return (
    <div className="bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-600/20 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h3 className="font-black text-xl text-white italic tracking-tight flex items-center gap-2">
            <PresentationChartLineIcon className="w-6 h-6 text-[#E50914]" /> Curva de Ingresos por Horario
          </h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Sincronización en tiempo real vía PostgreSQL GROUP BY</p>
        </div>
        
        <div className="flex items-center gap-3 bg-black/60 px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block">Pico Máximo Hora</span>
            <span className="text-sm font-black text-emerald-400 font-mono">${picoMaximo.toLocaleString('es-CO')}</span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block">Acumulado Gráfica</span>
            <span className="text-sm font-black text-white font-mono">${totalDia.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end gap-2 border-b border-white/10 pb-3 h-72 overflow-x-auto relative pt-8 scrollbar-thin scrollbar-thumb-zinc-800">
        {safeDatos.map((monto: number, h: number) => {
          const valorMonto = Number(monto || 0);
          const techo = Math.max(picoMaximo * 1.15, 10000); 
          let altura = techo > 0 ? (valorMonto / techo) * 100 : 0;
          if (valorMonto > 0 && altura < 6) altura = 6;

          return (
            <div key={h} className="flex-1 min-w-[34px] flex flex-col items-center h-full justify-end group/bar">
              {valorMonto > 0 ? (
                <span className="text-[9px] font-black text-emerald-400 mb-2 bg-zinc-900/95 px-2 py-0.5 rounded-md shadow-xl border border-emerald-500/30 group-hover/bar:scale-110 transition-transform whitespace-nowrap z-10">
                  ${valorMonto >= 1000 ? `${(valorMonto/1000).toFixed(0)}k` : valorMonto}
                </span>
              ) : (
                <span className="text-[9px] text-transparent mb-2 select-none">-</span>
              )}
              
              <div className="w-full sm:w-10 h-full bg-white/[0.03] rounded-t-xl relative flex flex-col justify-end border-t border-white/10 overflow-hidden shadow-inner">
                {valorMonto > 0 && (
                  <div 
                    className="w-full bg-gradient-to-t from-red-800 via-red-600 to-[#E50914] rounded-t-xl transition-all duration-700 shadow-[0_0_20px_rgba(229,9,20,0.6)] group-hover/bar:brightness-125" 
                    style={{ height: `${altura}%` }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-black mt-3 transition-colors ${valorMonto > 0 ? 'text-white' : 'text-slate-500'}`}>
                {h < 10 ? `0${h}` : h}:00
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        <span>00:00 Horas (Inicio de Jornada)</span>
        <span>23:00 Horas (Cierre)</span>
      </div>
    </div>
  );
}