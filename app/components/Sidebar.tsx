'use client';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingBagIcon, 
  DocumentArrowDownIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ vistaActiva, setVistaActiva, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', nombre: 'Inicio', icono: HomeIcon },
    { id: 'productos', nombre: 'Productos', icono: CubeIcon },
    { id: 'historial', nombre: 'Historial Compras/Ventas', icono: ShoppingBagIcon },
    { id: 'pdf', nombre: 'PDF Mensual / Reportes', icono: DocumentArrowDownIcon },
  ];

  return (
    <aside className="w-64 bg-[#0c0c0c] border-r border-white/10 min-h-screen p-4 flex flex-col justify-between text-white">
      <div className="space-y-6">
        {/* Logo / Encabezado */}
        <div className="px-3 py-2">
          <h2 className="text-xl font-black italic tracking-tighter text-[#E50914]">WASH RIDERS</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Sistema de Inventarios</p>
        </div>

        {/* Menú de Opciones */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icono = item.icono;
            const activo = vistaActiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setVistaActiva(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all ${
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
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase text-red-400 hover:bg-red-950/30 transition-all border border-red-500/20"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
        Cerrar Sesión
      </button>
    </aside>
  );
}