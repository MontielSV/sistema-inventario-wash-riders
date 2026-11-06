'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// 🔥 Importamos los Heroicons
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  ArchiveBoxIcon, 
  ShoppingCartIcon, 
  PresentationChartLineIcon, 
  ShieldCheckIcon, 
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

import DashboardView from '../components/admin/DashboardView';
import ProductosView from '../components/admin/ProductosView';
import InventarioView from '../components/admin/InventarioView';
import VentasView from '../components/admin/VentasView';
import ReportesView from '../components/admin/ReportesView';
import UsuariosView from '../components/admin/UsuariosView';
import ConfiguracionView from '../components/admin/ConfiguracionView';

export default function AdminDashboardMaster() {
  const [usuario, setUsuario] = useState<any>(null);
  const [rolUsuario, setRolUsuario] = useState<string>(''); // Guardamos el rol aquí
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [errorLogin, setErrorLogin] = useState('');
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const verificarAccesoEnBD = async (emailUser: string) => {
    try {
      const res = await fetch('/api/usuarios/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailUser })
      });
      const data = await res.json();
      if (data.autorizado) {
        return data.rol; // Retorna el rol si está autorizado
      }
      return null;
    } catch (e) {
      console.error("Error al validar con el servidor:", e);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const rol = await verificarAccesoEnBD(user.email);
        if (rol) {
          setUsuario(user);
          setRolUsuario(rol);
        } else {
          setErrorLogin(`Acceso denegado: El correo ${user.email} no tiene permisos registrados.`);
          await signOut(auth);
          setUsuario(null);
          setRolUsuario('');
        }
      } else {
        setUsuario(null);
        setRolUsuario('');
      }
      setCargandoAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const iniciarSesionGoogle = async () => {
    setErrorLogin('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const emailUser = result.user.email;
      
      if (emailUser) {
        const rol = await verificarAccesoEnBD(emailUser);
        if (!rol) {
          setErrorLogin(`Acceso denegado: El correo ${emailUser} no está autorizado.`);
          await signOut(auth);
          setUsuario(null);
        }
      }
    } catch (error) {
      setErrorLogin('Error al conectar con Google.');
    }
  };

  const cerrarSesion = async () => {
    await signOut(auth);
    setUsuario(null);
    setRolUsuario('');
    setVistaActiva('dashboard'); // Reinicia a la vista por defecto al salir
  };

  if (cargandoAuth) {
    return <main className="min-h-screen bg-[#121212] flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-[#E50914] border-t-transparent rounded-full"></div></main>;
  }

  if (!usuario) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-6 text-white font-sans">
        <div className="max-w-md w-full bg-[#181818] rounded-3xl p-8 border border-white/10 text-center shadow-2xl">
          <div className="w-20 h-20 mb-6 bg-black rounded-2xl mx-auto flex items-center justify-center border border-white/20">
            <img src="/logo.png" alt="Mr Kings Logo" className="w-full h-full object-contain p-2" />
          </div>
          
          {/* Título de inicio de sesión con Heroicon en lugar del emoji */}
          <h1 className="text-2xl font-black text-[#E50914] mb-2 italic flex items-center justify-center gap-2">
            <span>ENTERPRISE ADMIN</span>
            <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-6 h-6 shrink-0" />
            </span>
          </h1>
          
          <p className="text-xs text-slate-400 mb-8 font-bold uppercase tracking-widest">Control de Acceso por Roles (RBAC)</p>
          
          {errorLogin && <div className="mb-6 p-3 bg-red-950/80 text-red-300 text-xs rounded-xl font-bold border border-red-500/40">{errorLogin}</div>}

          <button onClick={iniciarSesionGoogle} className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-3">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.3 7.23 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.13 0 9.89 0 11.75s.43 3.62 1.19 5.17l4.09-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.7 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
            Ingresar con Google
          </button>
          <Link href="/" className="mt-6 flex justify-center items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-wider">
            <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
              <ArrowLeftIcon className="w-4 h-4 shrink-0" /> 
            </span>
            Volver a la tienda
          </Link>
        </div>
      </main>
    );
  }

  // LÓGICA DE ROLES
  const esRootOGerente = rolUsuario.includes('Root') || rolUsuario.includes('Gerente') || rolUsuario.includes('Propietario');
  const esSupervisor = rolUsuario.includes('Supervisor') || esRootOGerente;

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col md:flex-row font-sans overflow-x-hidden">
      
      {/* SIDEBAR CON RESTRICCIONES DE ROL */}
      <aside className={`fixed md:relative z-40 w-72 bg-[#181818] border-r border-white/10 h-full flex flex-col justify-between transition-transform duration-300 ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 overflow-y-auto h-full hide-scrollbar">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black rounded-xl border border-white/20 flex items-center justify-center p-1"><img src="/logo.png" alt="Logo" className="w-full" /></div>
              <div>
                <h2 className="font-black text-[#E50914] text-sm tracking-wide">MR KINGS</h2>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{rolUsuario}</p>
              </div>
            </div>
            <button onClick={() => setMenuMovilAbierto(false)} className="md:hidden text-slate-400 hover:text-white font-bold shrink-0">
              <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
                <XMarkIcon className="w-6 h-6 shrink-0" />
              </span>
            </button>
          </div>

          <nav className="space-y-1.5 font-bold text-xs">
            
            {/* VISIBLE PARA TODOS (Cajero, Supervisor, Gerente) */}
            <button onClick={() => { setVistaActiva('dashboard'); setMenuMovilAbierto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${vistaActiva === 'dashboard' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                <ChartBarIcon className="w-5 h-5 shrink-0" />
              </span>
              Dashboard
            </button>

            {/* VISIBLE SOLO PARA SUPERVISORES Y GERENTES */}
            {esSupervisor && (
              <>
                <button onClick={() => { setVistaActiva('productos'); setMenuMovilAbierto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${vistaActiva === 'productos' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <ShoppingBagIcon className="w-5 h-5 shrink-0" /> 
                  </span>
                  Productos & Catálogo
                </button>
                <button onClick={() => { setVistaActiva('inventario'); setMenuMovilAbierto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${vistaActiva === 'inventario' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <ArchiveBoxIcon className="w-5 h-5 shrink-0" /> 
                  </span>
                  Inventario & Stock
                </button>
              </>
            )}

            {/* VISIBLE PARA TODOS (Cajero, Supervisor, Gerente) */}
            <button onClick={() => { setVistaActiva('ventas'); setMenuMovilAbierto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${vistaActiva === 'ventas' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                <ShoppingCartIcon className="w-5 h-5 shrink-0" /> 
              </span>
              Ventas & Pedidos
            </button>

            {/* SECCIONES EXCLUSIVAS ROOT / GERENTE */}
            {esRootOGerente && (
              <>
                <button onClick={() => { setVistaActiva('reportes'); setMenuMovilAbierto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${vistaActiva === 'reportes' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <PresentationChartLineIcon className="w-5 h-5 shrink-0" /> 
                  </span>
                  Reportes Avanzados
                </button>
                <button onClick={() => { setVistaActiva('usuarios'); setMenuMovilAbierto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${vistaActiva === 'usuarios' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <ShieldCheckIcon className="w-5 h-5 shrink-0" /> 
                  </span>
                  Roles & Usuarios
                </button>
                <button onClick={() => { setVistaActiva('configuracion'); setMenuMovilAbierto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${vistaActiva === 'configuracion' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <Cog6ToothIcon className="w-5 h-5 shrink-0" /> 
                  </span>
                  Configuración
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-white/10 bg-[#141414]">
          <div className="mb-3">
            <p className="text-[9px] text-slate-500 uppercase font-black">SESIÓN ACTIVA:</p>
            <p className="text-xs font-bold text-white truncate" title={usuario.email}>{usuario.email}</p>
            <span className="inline-block mt-1 bg-red-950 text-[#E50914] border border-red-500/30 text-[9px] px-2 py-0.5 rounded font-black uppercase flex items-center gap-1 w-fit">
              <span className="w-3 h-3 inline-flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-3 h-3 shrink-0" />
              </span>
              {rolUsuario}
            </span>
          </div>
          <button onClick={cerrarSesion} className="w-full bg-black hover:bg-red-950 text-white border border-white/10 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
            <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
              <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" /> 
            </span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO DINÁMICO */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="md:hidden bg-[#181818] border-b border-white/10 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <button onClick={() => setMenuMovilAbierto(true)} className="bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0">
            <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
              <Bars3Icon className="w-5 h-5 shrink-0" /> 
            </span>
            Menú Admin
          </button>
          <span className="text-xs font-black text-[#E50914]">{rolUsuario}</span>
          <Link href="/" className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
             Tienda 
             <span className="w-3 h-3 inline-flex items-center justify-center shrink-0">
               <ArrowLeftIcon className="w-3 h-3 shrink-0" />
             </span>
          </Link>
        </header>

        <div className="p-6 sm:p-10 flex-1">
          {/* Protección extra para evitar que accedan cambiando el estado manualmente */}
          {vistaActiva === 'dashboard' && <DashboardView />}
          {vistaActiva === 'ventas' && <VentasView />}
          
          {vistaActiva === 'productos' && esSupervisor && <ProductosView />}
          {vistaActiva === 'inventario' && esSupervisor && <InventarioView />}
          
          {vistaActiva === 'reportes' && esRootOGerente && <ReportesView />}
          {vistaActiva === 'usuarios' && esRootOGerente && <UsuariosView />}
          {vistaActiva === 'configuracion' && esRootOGerente && <ConfiguracionView />}
        </div>
      </main>

    </div>
  );
}