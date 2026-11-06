'use client';

import { TrophyIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface MetaDiariaProps {
  ventasHoy: number;
  metaVentas: number;
  editandoMeta: boolean;
  inputMeta: string;
  setInputMeta: (val: string) => void;
  guardarMeta: () => void;
  setEditandoMeta: (val: boolean) => void;
}

export default function MetaDiaria({ 
  ventasHoy = 0, 
  metaVentas = 1, 
  editandoMeta, 
  inputMeta, 
  setInputMeta, 
  guardarMeta, 
  setEditandoMeta 
}: MetaDiariaProps) {
  
  const porcentajeMeta = metaVentas > 0 ? Math.min((ventasHoy / metaVentas) * 100, 100) : 0;
  const metaSuperada = ventasHoy >= metaVentas;
  const faltante = Math.max(metaVentas - ventasHoy, 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') guardarMeta();
    if (e.key === 'Escape') setEditandoMeta(false);
  };

  return (
    <div className={`bg-[#0f0f0f]/80 backdrop-blur-3xl backdrop-saturate-150 p-8 rounded-[2.5rem] border transition-all duration-700 shadow-2xl flex flex-col justify-between relative overflow-hidden group ${
      metaSuperada ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : 'border-white/10 hover:border-white/20'
    }`}>
      
      <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        metaSuperada ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-[#E50914]/10 group-hover:bg-[#E50914]/20'
      }`} />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center shadow-inner">
              <TrophyIcon className="w-6 h-6 text-[#E50914]" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white tracking-tight">Meta de Ventas Diaria</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Objetivo gerencial corporativo</p>
            </div>
          </div>
          {editandoMeta ? (
             <button 
               onClick={guardarMeta} 
               className="text-[10px] bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl font-black text-white transition-all shadow-lg active:scale-95 focus:ring-2 focus:ring-emerald-400 outline-none"
             >
               Guardar
             </button>
          ) : (
             <button 
               onClick={() => setEditandoMeta(true)} 
               className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl font-black border border-white/10 transition-all shadow-md focus:ring-2 focus:ring-white/20 outline-none"
             >
               Editar Meta
             </button>
          )}
        </div>

        {editandoMeta ? (
          <div className="relative mb-6 animate-in zoom-in-95 duration-200">
            <span className="absolute left-4 top-3.5 text-slate-400 font-bold">$</span>
            <input 
              type="number" 
              autoFocus
              value={inputMeta} 
              onChange={e => setInputMeta(e.target.value)} 
              onKeyDown={handleKeyDown}
              className="w-full bg-zinc-950 border-2 border-[#E50914] text-white pl-10 pr-4 py-3 rounded-2xl text-base font-black outline-none focus:ring-4 focus:ring-red-900/50 shadow-inner transition-all"
              placeholder="Ej: 1000000"
            />
            <p className="text-[9px] text-slate-500 font-bold mt-2 ml-1 uppercase tracking-wider">Presiona Enter para guardar o Esc para cancelar</p>
          </div>
        ) : (
          <div className="mb-6 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex justify-between items-center shadow-lg">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Ventas Actuales</span>
              <span className="text-xl font-black text-white font-mono mt-0.5">${ventasHoy.toLocaleString('es-CO')}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Meta Establecida</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5">${metaVentas.toLocaleString('es-CO')}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-end text-xs font-black mb-3">
          <span className={metaSuperada ? 'text-emerald-400 font-black tracking-wide text-sm flex items-center gap-1.5' : 'text-slate-300'}>
            {metaSuperada ? (
              <><RocketLaunchIcon className="w-5 h-5" /> ¡Meta Diaria Superada con Éxito!</>
            ) : (
              `Faltan $${faltante.toLocaleString('es-CO')} para cumplir la meta`
            )}
          </span>
          <span className="text-slate-400 font-mono font-bold text-sm">{porcentajeMeta.toFixed(1)}%</span>
        </div>

        <div className="w-full h-4 bg-zinc-950 rounded-full border border-white/10 p-0.5 overflow-hidden shadow-inner relative">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              metaSuperada ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.9)] animate-pulse' : 'bg-gradient-to-r from-red-700 via-red-500 to-white shadow-[0_0_15px_rgba(229,9,20,0.5)]'
            }`} 
            style={{ width: `${porcentajeMeta}%` }}
          />
        </div>
      </div>
      
      <div className="relative z-10 flex justify-between items-center mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-white/5">
        <span>0% (Inicio)</span>
        <span className="text-slate-300 font-mono">Progreso en vivo</span>
        <span>100% (Meta)</span>
      </div>
    </div>
  );
}