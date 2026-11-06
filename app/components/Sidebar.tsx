'use client';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingBagIcon, 
  ShoppingCartIcon,
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
  const menuItems = [
    { id: 'dashboard', nombre: 'Inicio', icono: HomeIcon, tono: 'text-cyan-300' },
    { id: 'productos', nombre: 'Productos', icono: CubeIcon, tono: 'text-sky-300' },
    { id: 'ventas', nombre: 'Registrar venta', icono: ShoppingCartIcon, tono: 'text-emerald-300' },
    { id: 'historial', nombre: 'Historial', icono: ShoppingBagIcon, tono: 'text-amber-300' },
    { id: 'reporte-ventas', nombre: 'Reporte de ventas', icono: CurrencyDollarIcon, tono: 'text-teal-300' },
    { id: 'pdf', nombre: 'Reporte mensual', icono: ChartBarIcon, tono: 'text-violet-300' },
  ];

  return (
    <aside className={`w-full border-b p-3 text-white print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-screen lg:w-64 lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:p-4 ${tema === 'dark' ? 'border-slate-700 bg-[#081a2b]' : 'border-[#1f5a8a] bg-[#123b60]'}`}>
      <div className="space-y-3 lg:space-y-6">
        {/* Logo / Encabezado */}
        <div className="px-3 py-2">
          <h2 className="text-xl font-black tracking-tight text-white">WASH RIDERS</h2>
          <p className="text-[10px] uppercase tracking-widest text-blue-100">Sistema de inventario</p>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Cambiar a modo ${tema === 'light' ? 'oscuro' : 'claro'}`}
          className="flex w-full items-center gap-3 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-left text-xs font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
        >
          {tema === 'light' ? <MoonIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-yellow-300" /> : <SunIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-yellow-300" />}
          Cambiar a modo {tema === 'light' ? 'oscuro' : 'claro'}
        </button>

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
                    ? 'border-l-4 border-white bg-white font-bold text-[#123b60] shadow-md shadow-black/20'
                    : 'text-blue-50 hover:bg-[#1f5a8a] hover:text-white'
                }`}
              >
                <Icono className={`h-5 w-5 shrink-0 ${activo ? 'text-[#123b60]' : item.tono}`} />
                {item.nombre}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={onLogout}
        className="mt-3 flex w-full items-center gap-3 rounded-lg border border-white/30 px-4 py-2.5 text-xs font-bold uppercase text-white transition-all hover:bg-white/10 hover:text-white lg:mt-0 lg:py-3"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
        Cerrar Sesión
      </button>
    </aside>
  );
}