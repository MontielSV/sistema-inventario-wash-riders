'use client';
import { useEffect, useRef, useState } from 'react';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingBagIcon, 
  ShoppingCartIcon,
  ArrowsRightLeftIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
  onLogout: () => void;
  tema: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Sidebar({ vistaActiva, setVistaActiva, onLogout, tema, onToggleTheme }: SidebarProps) {
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const dialogoCierreRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = dialogoCierreRef.current;
    if (confirmarCierre && dialogo && !dialogo.open) dialogo.showModal();
  }, [confirmarCierre]);

  const menuItems = [
    { id: 'dashboard', nombre: 'Inicio', icono: HomeIcon, tono: 'text-cyan-300' },
    { id: 'productos', nombre: 'Productos', icono: CubeIcon, tono: 'text-sky-300' },
    { id: 'ventas', nombre: 'Registrar venta', icono: ShoppingCartIcon, tono: 'text-emerald-300' },
    { id: 'registrar-movimiento', nombre: 'Registrar movimiento', icono: ArrowsRightLeftIcon, tono: 'text-blue-200' },
    { id: 'historial', nombre: 'Historial', icono: ShoppingBagIcon, tono: 'text-amber-300' },
    { id: 'reporte-ventas', nombre: 'Reporte de ventas', icono: CurrencyDollarIcon, tono: 'text-teal-300' },
    { id: 'pdf', nombre: 'Reporte mensual', icono: ChartBarIcon, tono: 'text-violet-300' },
  ];

  return (
    <>
      <aside className={`sticky top-0 z-30 flex w-full flex-col gap-2 border-b px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shadow-md print:hidden lg:h-screen lg:min-h-screen lg:w-64 lg:justify-between lg:border-b-0 lg:border-r lg:p-4 lg:shadow-none ${tema === 'dark' ? 'border-slate-700 bg-[#081a2b]' : 'border-[#1f5a8a] bg-[#123b60]'}`}>
        <div className="flex flex-col gap-2 lg:block lg:space-y-6">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div className="min-w-0 px-1 py-1 lg:px-3 lg:py-2">
              <h2 className="text-lg font-black tracking-tight text-white lg:text-xl">WASH RIDERS</h2>
              <p className="text-[10px] uppercase tracking-widest text-blue-100">Sistema de inventario</p>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={`Cambiar a modo ${tema === 'light' ? 'oscuro' : 'claro'}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 sm:h-auto sm:w-auto sm:justify-start sm:px-3 sm:py-2.5 lg:mt-6 lg:w-full lg:px-4"
            >
              {tema === 'light' ? <MoonIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-yellow-300" /> : <SunIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-yellow-300" />}
              <span className="hidden sm:inline">Cambiar a modo {tema === 'light' ? 'oscuro' : 'claro'}</span>
            </button>
          </div>

          <nav className="flex w-full snap-x gap-2 overflow-x-auto overscroll-x-contain pb-1 pt-0.5 lg:flex-col lg:snap-none lg:space-y-1 lg:overflow-visible lg:pb-0 lg:pt-0" aria-label="Navegación principal">
            {menuItems.map((item) => {
              const Icono = item.icono;
              const activo = vistaActiva === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVistaActiva(item.id)}
                  aria-current={activo ? 'page' : undefined}
                  className={`flex min-h-11 w-auto shrink-0 snap-start items-center gap-2 rounded-lg border-b-2 px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 lg:min-h-0 lg:w-full lg:gap-3 lg:border-b-0 lg:border-l-4 lg:px-4 lg:py-3 ${
                    activo
                      ? tema === 'dark'
                        ? 'border-sky-200 bg-sky-200 font-bold text-[#081a2b] shadow-md shadow-black/20'
                        : 'border-white bg-white font-bold text-[#123b60] shadow-md shadow-black/20'
                      : 'border-transparent text-blue-50 hover:bg-[#1f5a8a] hover:text-white'
                  }`}
                >
                  <Icono className={`h-5 w-5 shrink-0 ${activo ? (tema === 'dark' ? 'text-[#081a2b]' : 'text-[#123b60]') : item.tono}`} />
                  {item.nombre}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex justify-end border-t border-white/15 pt-2 lg:border-0 lg:pt-0">
          <button
            type="button"
            onClick={() => setConfirmarCierre(true)}
            className="flex min-h-11 w-auto items-center gap-2 rounded-lg border border-red-200/30 bg-red-950/20 px-3 text-xs font-bold uppercase text-red-100 transition-colors hover:bg-red-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200 lg:w-full lg:gap-3 lg:px-4 lg:py-3"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <dialog
        ref={dialogoCierreRef}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        onClose={() => setConfirmarCierre(false)}
        className={`m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border p-0 shadow-2xl backdrop:bg-slate-950/60 ${
          tema === 'dark'
            ? 'border-slate-700 bg-[#10263b] text-slate-100'
            : 'border-blue-100 bg-white text-slate-900'
        }`}
      >
        <div className="p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-700">
            <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 id="logout-dialog-title" className="text-lg font-bold">¿Cerrar sesión?</h2>
          <p id="logout-dialog-description" className={`mt-2 text-sm leading-6 ${tema === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Vas a salir de tu cuenta de Wash Riders. Tendrás que ingresar nuevamente para volver al panel.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialogoCierreRef.current?.close()}
              className={`min-h-11 rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                tema === 'dark'
                  ? 'border-slate-600 text-slate-100 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Seguir conectado
            </button>
            <button
              type="button"
              onClick={() => {
                dialogoCierreRef.current?.close();
                onLogout();
              }}
              className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white transition-colors hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Sí, cerrar sesión
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}