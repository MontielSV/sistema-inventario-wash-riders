'use client';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingBagIcon, 
  ShoppingCartIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ vistaActiva, setVistaActiva, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', nombre: 'Inicio', icono: HomeIcon, tono: 'text-sky-700' },
    { id: 'productos', nombre: 'Productos', icono: CubeIcon, tono: 'text-blue-800' },
    { id: 'ventas', nombre: 'Registrar venta', icono: ShoppingCartIcon, tono: 'text-emerald-700' },
    { id: 'historial', nombre: 'Historial', icono: ShoppingBagIcon, tono: 'text-amber-700' },
    { id: 'reporte-ventas', nombre: 'Reporte de ventas', icono: CurrencyDollarIcon, tono: 'text-teal-700' },
    { id: 'pdf', nombre: 'Reporte mensual', icono: ChartBarIcon, tono: 'text-indigo-700' },
  ];

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-3 text-slate-900 print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-screen lg:w-64 lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:p-4">
      <div className="space-y-3 lg:space-y-6">
        {/* Logo / Encabezado */}
        <div className="px-3 py-2">
          <h2 className="text-xl font-black tracking-tight text-[#123b60]">WASH RIDERS</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Sistema de inventario</p>
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
                className={`w-auto shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all lg:w-full lg:gap-3 lg:px-4 lg:py-3 ${
                  activo 
                    ? 'bg-[#1f5a8a] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-900'
                }`}
              >
                <Icono className={`h-5 w-5 shrink-0 ${activo ? 'text-white' : item.tono}`} />
                {item.nombre}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={onLogout}
        className="mt-3 flex w-full items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold uppercase text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 lg:mt-0 lg:py-3"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
        Cerrar Sesión
      </button>
    </aside>
  );
}