'use client';
import { useState } from 'react';
import { BoltIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface PagosDesglose {
  efectivo?: number;
  digital?: number;
}

interface FinanzasData {
  ventasHoy?: number;
  transaccionesHoy?: number;
  ticketPromedio?: number;
}

interface VentanaModularProps {
  data?: FinanzasData | null;
  pagos?: PagosDesglose | null;
}

export default function VentanaModularFinanciera({ data = {}, pagos = {} }: VentanaModularProps) {
  const [subModulo, setSubModulo] = useState<'finanzas' | 'operacion'>('finanzas');

  const { ventasHoy = 0, transaccionesHoy = 0, ticketPromedio = 0 } = data || {};
  const { efectivo = 0, digital = 0 } = pagos || {};

  return (
    <div className="bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#E50914]/20 transition-all duration-700" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10 mb-6">
        <div>
          <h3 className="font-black text-xl text-white italic tracking-tight flex items-center gap-2">
            <BoltIcon className="w-6 h-6 text-[#E50914]" /> Panel Financiero & Pasarelas
          </h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Módulo autónomo sincronizado en tiempo real</p>
        </div>
        <div className="flex bg-black p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button onClick={() => setSubModulo('finanzas')} className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${subModulo === 'finanzas' ? 'bg-[#E50914] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <ChartBarIcon className="w-4 h-4" /> Finanzas
          </button>
          <button onClick={() => setSubModulo('operacion')} className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${subModulo === 'operacion' ? 'bg-zinc-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Cog6ToothIcon className="w-4 h-4" /> Detalles Caja
          </button>
        </div>
      </div>

      <div className="min-h-[220px] flex flex-col justify-center">
        {subModulo === 'finanzas' ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-black/50 p-4 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
              <span className="text-slate-300 font-bold text-xs">Ventas Totales Hoy</span>
              <span className="text-emerald-400 font-black text-base font-mono">${ventasHoy.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-4 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
              <span className="text-slate-300 font-bold text-xs">Transacciones Exitosas</span>
              <span className="text-white font-black text-base font-mono">{transaccionesHoy} órdenes</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-4 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
              <span className="text-slate-300 font-bold text-xs">Ticket Promedio</span>
              <span className="text-[#E50914] font-black text-base font-mono">${ticketPromedio.toLocaleString('es-CO')}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Desglose de Caja en Vivo</div>
            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Efectivo en Caja Física:</span>
                <span className="text-emerald-400 font-mono text-sm">${efectivo.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-white/5">
                <span className="text-slate-300 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#E50914]" /> Transferencias / Digital:</span>
                <span className="text-[#E50914] font-mono text-sm">${digital.toLocaleString('es-CO')}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium italic">Datos calculados mediante agregación SQL desde la base de datos.</p>
          </div>
        )}
      </div>
    </div>
  );
}