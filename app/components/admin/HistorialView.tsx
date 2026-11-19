'use client';

import { useState } from 'react';
import InventarioView from './InventarioView';
import HistorialActividadView from './HistorialActividadView';

type HistorialTab = 'movimientos' | 'actividad';

export default function HistorialView() {
  const [tab, setTab] = useState<HistorialTab>('movimientos');
  const tabs: { id: HistorialTab; label: string }[] = [
    { id: 'movimientos', label: 'Movimientos de inventario' },
    { id: 'actividad', label: 'Actividad del sistema' },
  ];

  return (
    <div>
      <nav
        aria-label="Secciones del historial"
        role="tablist"
        className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 pt-4 sm:px-8"
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
                ? 'bg-[#123b60] text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
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
          ? <InventarioView vista="historial" />
          : <HistorialActividadView />}
      </div>
    </div>
  );
}
