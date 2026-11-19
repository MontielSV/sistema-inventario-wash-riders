'use client';

import { useState } from 'react';
import InventarioView from './InventarioView';
import HistorialActividadView from './HistorialActividadView';

type HistorialTab = 'movimientos' | 'actividad';

export default function HistorialView() {
  const [tab, setTab] = useState<HistorialTab>('movimientos');
  const tabs: { id: HistorialTab; label: string }[] = [
    { id: 'movimientos', label: 'Movimientos de inventario' },
    { id: 'actividad', label: 'Movimiento de Usuarios' },
  ];
  const tabsNav = (
    <nav
      aria-label="Secciones del historial"
      role="tablist"
      className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 sm:px-8"
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
  );

  return (
    <div
      id="historial-tabpanel"
      role="tabpanel"
      aria-labelledby={`historial-tab-${tab}`}
    >
      {tab === 'movimientos'
        ? <InventarioView vista="historial" headerContent={tabsNav} />
        : <HistorialActividadView headerContent={tabsNav} />}
    </div>
  );
}
