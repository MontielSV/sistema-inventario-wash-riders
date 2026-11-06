'use client';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  ClockIcon, 
  CalendarDaysIcon, 
  DocumentChartBarIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ vistaActiva, setVistaActiva, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'inicio', nombre: 'Inicio', icono: HomeIcon },
    { id: 'productos', nombre: 'Productos', icono: CubeIcon },
    { id: 'registrar-venta', nombre: 'Registrar venta', icono: ShoppingCartIcon },
    { id: 'historial', nombre: 'Historial', icono: ClockIcon },
    { id: 'reporte-ventas', nombre: 'Reporte de ventas', icono: CalendarDaysIcon },
    { id: 'reporte-mensual', nombre: 'Reporte mensual', icono: DocumentChartBarIcon },
  ];

  return (
    <aside className="w-full bg-[#0c0c0c] border-b border-white/10 p-3 text-white print:hidden lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-4 lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-3 lg:space-y-6">
        {/* Logo / Encabezado */}
        <div className="px-3 py-2">
          <h2 className="text-xl font-black italic tracking-tighter text-[#E50914]">WASH RIDERS</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Sistema de Inventarios</p>
        </div>

        {/* Menú de Opciones */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:space-y-1" aria-label="Navegación principal">
          {menuItems.map((item) => {
            const Icono = item.icono;
            const activo = vistaActiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setVistaActiva(item.id)}
                className={`w-auto shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all lg:w-full lg:gap-3 lg:px-4 lg:py-3 lg:text-xs ${
                  activo 
                    ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/40' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icono className="w-5 h-5 shrink-0" />
                {item.nombre}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={onLogout}
        className="mt-3 w-full flex items-center gap-3 px-4 py-2.5 lg:py-3 rounded-lg text-xs font-bold uppercase text-red-400 hover:bg-red-950/30 transition-all border border-red-500/20 lg:mt-0"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
        Cerrar Sesión
      </button>
    </aside>
  );
}