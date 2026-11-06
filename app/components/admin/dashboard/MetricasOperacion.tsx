'use client';

import { ServerStackIcon, TrophyIcon, InboxIcon } from '@heroicons/react/24/outline';

interface ProductoBase {
  nombre: string;
  cantidad: number;
}

interface MetricasOperacionProps {
  topProductos?: ProductoBase[] | null;
}

export default function MetricasOperacion({ topProductos = [] }: MetricasOperacionProps) {
  const safeProductos = Array.isArray(topProductos) ? topProductos : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
      
      <div className="bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-1">Infraestructura</span>
          <h3 className="font-black text-xl text-white tracking-tight">Estado del Sistema</h3>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono flex items-center gap-2">
            <ServerStackIcon className="w-7 h-7 text-emerald-400" /> PostgreSQL Óptimo
          </p>
        </div>
        <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-3 bg-black/50 p-4 rounded-2xl border border-white/5 shadow-inner">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-300">Consultas con GROUP BY activas</span>
        </div>
      </div>

      <div className="md:col-span-2 bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#E50914]/20 transition-all duration-700" />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-xl text-white italic tracking-tight flex items-center gap-2">
              Top 5 Platos Más Vendidos Hoy <TrophyIcon className="w-6 h-6 text-amber-400" />
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Agregación en tiempo real de JSONB nativo</p>
          </div>
          <span className="text-[10px] bg-zinc-900 text-emerald-400 font-black px-3 py-1 rounded-xl border border-emerald-500/20 shadow-inner">En Vivo</span>
        </div>

        <div className="space-y-3">
          {safeProductos.length === 0 ? (
            <div className="text-center py-12 bg-black/40 rounded-2xl border border-white/5 space-y-2">
              <InboxIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-xs font-bold">Aún no se registran platos completados en la jornada de hoy.</p>
              <p className="text-[10px] text-slate-600">El ranking se actualizará automáticamente con cada orden finalizada.</p>
            </div>
          ) : (
            safeProductos.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 group/item">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center font-black text-xs text-[#E50914] border border-white/10 shadow-inner">#{i + 1}</span>
                  <span className="font-black text-base text-white tracking-wide">{p.nombre}</span>
                </div>
                <div className="bg-red-950/40 border border-red-500/30 px-3.5 py-1.5 rounded-xl shadow-lg">
                  <span className="text-sm font-black text-[#E50914] font-mono">{p.cantidad} unds</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}