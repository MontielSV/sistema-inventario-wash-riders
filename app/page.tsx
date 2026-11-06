'use client';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/admin/DashboardView';
import ProductosView from './components/admin/ProductosView';
import InventarioView from './components/admin/InventarioView';
import ReportePDFView from './components/ReportePDFView';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [autenticado, setAutenticado] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  
  // Estados para el login
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [cargandoLogin, setCargandoLogin] = useState(false);

  useEffect(() => {
    fetch('/api/login', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setAutenticado(Boolean(data.autenticado)))
      .catch(() => setAutenticado(false))
      .finally(() => setCargandoSesion(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoLogin(true);
    setErrorLogin('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const data = await res.json();

      if (res.ok && data.exito) {
        setAutenticado(true);
      } else {
        setErrorLogin(data.error || 'Credenciales inválidas');
      }
    } catch {
      setErrorLogin('Error conectando con el servidor');
    } finally {
      setCargandoLogin(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/login', { method: 'DELETE' });
    setAutenticado(false);
    setVistaActiva('dashboard');
  };

  if (cargandoSesion) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <p className="text-sm font-bold text-slate-400">Verificando sesión...</p>
      </div>
    );
  }

  // 1. Si no está autenticado, muestra la Pantalla de Login
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4 font-sans bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(229,9,20,0.15),rgba(0,0,0,0))]">
        <div className="max-w-md w-full bg-[#0f0f0f]/95 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black italic tracking-tighter text-[#E50914]">
              WASH RIDERS
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Control de Inventario & Gestión
            </p>
          </div>

          {errorLogin && (
            <div className="bg-red-950/60 border border-red-500/40 p-3 rounded-xl text-red-400 text-xs font-bold text-center">
              ⚠️ {errorLogin}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Usuario</label>
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña</label>
              <div className="relative">
                <LockClosedIcon className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargandoLogin}
              className="w-full bg-[#E50914] hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              {cargandoLogin ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-600 uppercase tracking-wider">
            Acceso restringido únicamente para personal autorizado
          </p>
          {process.env.NEXT_PUBLIC_DEVELOPER_EMAIL ? (
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_DEVELOPER_EMAIL}?subject=Soporte%20Wash%20Riders`}
              className="block text-center text-xs font-semibold text-slate-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
            >
              Contactar al desarrollador
            </a>
          ) : (
            <p className="text-center text-xs font-semibold text-slate-400">Contactar al desarrollador</p>
          )}
        </div>
      </div>
    );
  }

  // 2. Si está autenticado, muestra el Panel con Sidebar Lateral
  return (
    <div className="flex min-h-screen flex-col bg-[#030303] lg:flex-row">
      <Sidebar 
        vistaActiva={vistaActiva} 
        setVistaActiva={setVistaActiva} 
        onLogout={handleLogout} 
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {vistaActiva === 'dashboard' && <DashboardView />}
        {vistaActiva === 'productos' && <ProductosView />}
        {vistaActiva === 'historial' && <InventarioView />}
        {vistaActiva === 'pdf' && <ReportePDFView />}
      </main>
    </div>
  );
}