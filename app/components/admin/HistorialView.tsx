'use client';

import { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import InventarioView from './InventarioView';
import HistorialActividadView from './HistorialActividadView';
import SectionHeader from './SectionHeader';

type HistorialTab = 'movimientos' | 'actividad';

export default function HistorialView() {
  const [tab, setTab] = useState<HistorialTab>('movimientos');
  const tabs: { id: HistorialTab; label: string }[] = [
    { id: 'movimientos', label: 'Movimientos de inventario' },
    { id: 'actividad', label: 'Movimiento de Usuarios' },
  ];

  return (
    <div className="inventory-light min-h-screen bg-[#030303] p-4 font-sans text-white md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <SectionHeader
          accent="amber"
          title="Historial"
          description="Consulta y filtra las entradas y salidas guardadas en el inventario."
          icon={<ClockIcon className="h-6 w-6" />}
        />
        <nav
          aria-label="Secciones del historial"
          role="tablist"
          className="flex w-full gap-2 overflow-x-auto"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              id={`historial-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls="historial-tabpanel"
              onClick={() => setTab(item.id)}
              className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-bold transition-colors ${
                tab === item.id
                  ? 'border border-amber-400 bg-amber-300 text-amber-950 shadow-sm'
                  : 'border border-blue-200 bg-white text-blue-900 hover:bg-blue-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div
          id="historial-tabpanel"
          role="tabpanel"
          aria-labelledby={`historial-tab-${tab}`}
        >
          {tab === 'movimientos'
            ? <InventarioView vista="historial" hideHeader />
            : <HistorialActividadView />}
        </div>
      </div>
    </div>
  );
}
