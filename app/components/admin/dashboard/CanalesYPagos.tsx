'use client';

import { 
  BanknotesIcon, 
  DevicePhoneMobileIcon, 
  BuildingLibraryIcon, 
  CreditCardIcon, 
  ChartPieIcon, 
  TrophyIcon 
} from '@heroicons/react/24/outline';

const ESTILOS_METODOS: Record<string, { punto: string; barra: string; badge: string }> = {
  efectivo: { punto: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]', barra: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]', badge: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' },
  nequi: { punto: 'bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.9)]', barra: 'bg-gradient-to-r from-purple-700 to-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.6)]', badge: 'bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-500/30' },
  bancolombia: { punto: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]', barra: 'bg-gradient-to-r from-yellow-600 to-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]', badge: 'bg-amber-950/60 text-amber-300 border-amber-500/30' },
  default: { punto: 'bg-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.9)]', barra: 'bg-gradient-to-r from-red-700 to-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.6)]', badge: 'bg-red-950/60 text-red-400 border-red-500/30' }
};

const CATEGORIAS_BASE = [
  { nombre: 'Efectivo', icono: <BanknotesIcon className="w-4 h-4 text-emerald-400" />, key: 'efectivo' },
  { nombre: 'Nequi', icono: <DevicePhoneMobileIcon className="w-4 h-4 text-fuchsia-400" />, key: 'nequi' },
  { nombre: 'Bancolombia', icono: <BuildingLibraryIcon className="w-4 h-4 text-amber-400" />, key: 'bancolombia' },
  { nombre: 'Tarjeta', icono: <CreditCardIcon className="w-4 h-4 text-slate-300" />, key: 'tarjeta' }
];

interface CanalesYPagosProps {
  pagos?: Record<string, number> | null;
}

export default function CanalesYPagos({ pagos = {} }: CanalesYPagosProps) {
  const safePagos = pagos || {};

  const pasarelasMapeadas = CATEGORIAS_BASE.map(cat => {
    const encontradoKey = Object.keys(safePagos).find(k => k.toLowerCase().includes(cat.nombre.toLowerCase()));
    return {
      ...cat,
      monto: encontradoKey ? Number(safePagos[encontradoKey] || 0) : 0,
    };
  });

  const totalPagos = pasarelasMapeadas.reduce((a, b) => a + b.monto, 0);
  const canalDominante = totalPagos > 0 
    ? pasarelasMapeadas.reduce((prev, current) => (prev.monto > current.monto) ? prev : current).nombre 
    : 'Sin Actividad';

  return (
    <div className="bg-[#0f0f0f]/80 backdrop-blur-3xl backdrop-saturate-150 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#E50914]/20 transition-all duration-700 ease-out" />

      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
              <ChartPieIcon className="w-6 h-6 text-[#E50914]" /> Análisis de Canales & Pagos
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Distribución comparativa en tiempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] bg-zinc-900/90 text-emerald-400 font-black px-3 py-1 rounded-xl border border-emerald-500/20 shadow-inner">
              SQL GROUP BY
            </span>
          </div>
        </div>

        <div className="mb-6 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex justify-between items-center shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Ingresos Pasarelas</span>
            <p className="text-xl font-black text-white font-mono mt-0.5">${totalPagos.toLocaleString('es-CO')}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Canal Líder Hoy</span>
            <p className="text-sm font-black text-emerald-400 uppercase tracking-wider mt-1 flex items-center justify-end gap-1.5">
              {totalPagos > 0 ? (
                <>{canalDominante} <TrophyIcon className="w-5 h-5 text-amber-400" /></>
              ) : 'Sin registros'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {pasarelasMapeadas.map((item, idx) => {
            const porcentaje = totalPagos > 0 ? (item.monto / totalPagos) * 100 : 0;
            const estilo = ESTILOS_METODOS[item.key] || ESTILOS_METODOS.default;

            return (
              <div key={idx} className="bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-black/50 transition-all duration-300 group/item">
                <div className="flex justify-between items-center text-xs font-black mb-2">
                  <span className="text-slate-200 flex items-center gap-2 capitalize">
                    <span className={`w-2.5 h-2.5 rounded-full ${estilo.punto}`} /> 
                    {item.icono} {item.nombre}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">${item.monto.toLocaleString('es-CO')}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${estilo.badge}`}>
                      {porcentaje.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-zinc-950 rounded-full border border-white/5 overflow-hidden p-0.5 shadow-inner">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${estilo.barra}`} style={{ width: `${porcentaje}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}