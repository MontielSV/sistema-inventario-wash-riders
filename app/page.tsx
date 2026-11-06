'use client';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/admin/DashboardView';
import ProductosView from './components/admin/ProductosView';
import InventarioView from './components/admin/InventarioView';
import RegistrarVentaView from './components/admin/RegistrarVentaView';
import ReportesInventarioView from './components/admin/ReportesInventarioView';
import { CubeIcon, LockClosedIcon, MoonIcon, SunIcon, UserIcon } from '@heroicons/react/24/outline';

type Tema = 'light' | 'dark';

export default function Home() {
  const [autenticado, setAutenticado] = useState(false);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [tema, setTema] = useState<Tema>('light');
  
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

  useEffect(() => {
    const temaGuardado = window.localStorage.getItem('wash-riders-theme');
    if (temaGuardado === 'light' || temaGuardado === 'dark') setTema(temaGuardado);
  }, []);

  const cambiarTema = () => {
    const nuevoTema = tema === 'light' ? 'dark' : 'light';
    setTema(nuevoTema);
    window.localStorage.setItem('wash-riders-theme', nuevoTema);
  };

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
      <main className="flex min-h-screen items-center justify-center bg-[#edf4fb] px-4 text-slate-700">
        <div role="status" className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          <p className="text-sm font-semibold">Verificando acceso...</p>
        </div>
      </main>
    );
  }

  // 1. Si no está autenticado, muestra la Pantalla de Login
  if (!autenticado) {
    return (
      <main className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-8 ${tema === 'dark' ? 'bg-[#081a2b] text-slate-100' : 'bg-[#dceeff] text-slate-900'}`}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-[#1f5a8a]" />
        <div className={`w-full max-w-md rounded-xl border px-6 py-8 shadow-[0_20px_65px_-36px_rgba(17,54,88,0.35)] sm:px-9 ${tema === 'dark' ? 'border-slate-700 bg-[#10263b]' : 'border-blue-200 bg-[#f2f8ff]'}`}>
          <section aria-labelledby="login-title" className="flex flex-col justify-center">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#123b60] text-white">
                <CubeIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black uppercase tracking-[0.12em] text-[#123b60]">Wash Riders</span>
                <span className={`mt-0.5 block text-[10px] font-semibold uppercase tracking-wider ${tema === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Inventario</span>
              </span>
              </div>
              <button
                type="button"
                onClick={cambiarTema}
                aria-label={`Cambiar a modo ${tema === 'light' ? 'oscuro' : 'claro'}`}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${tema === 'dark' ? 'border-slate-600 bg-slate-800 text-blue-100 hover:bg-slate-700' : 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100'}`}
              >
                {tema === 'light' ? <MoonIcon aria-hidden="true" className="h-4 w-4" /> : <SunIcon aria-hidden="true" className="h-4 w-4" />}
                Modo {tema === 'light' ? 'oscuro' : 'claro'}
              </button>
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Bienvenido</p>
              <h2 id="login-title" className={`mt-2 text-3xl font-black tracking-tight ${tema === 'dark' ? 'text-blue-100' : 'text-[#123b60]'}`}>Iniciar sesión</h2>
              <p className={`mt-2 text-sm ${tema === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Ingresa tus credenciales para continuar.</p>
            </div>

            {errorLogin && (
              <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorLogin}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-usuario" className={`mb-2 block text-sm font-semibold ${tema === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Usuario</label>
                <div className="relative">
                  <UserIcon aria-hidden="true" className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64829b]" />
                  <input
                    id="login-usuario"
                    name="usuario"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="Ingresa tu usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className={`w-full rounded-lg border py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#3478a9] focus:ring-4 focus:ring-blue-100 ${tema === 'dark' ? 'border-slate-600 bg-[#0b1c2d] text-slate-100 placeholder:text-slate-400' : 'border-blue-200 bg-[#eaf4ff] text-slate-900 placeholder:text-slate-500'}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className={`mb-2 block text-sm font-semibold ${tema === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Contraseña</label>
                <div className="relative">
                  <LockClosedIcon aria-hidden="true" className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64829b]" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-lg border py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#3478a9] focus:ring-4 focus:ring-blue-100 ${tema === 'dark' ? 'border-slate-600 bg-[#0b1c2d] text-slate-100 placeholder:text-slate-400' : 'border-blue-200 bg-[#eaf4ff] text-slate-900 placeholder:text-slate-500'}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargandoLogin}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f5a8a] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#174a74] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3478a9] disabled:cursor-wait disabled:opacity-70"
              >
                {cargandoLogin && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {cargandoLogin ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <div className={`mt-7 border-t pt-5 ${tema === 'dark' ? 'border-slate-700' : 'border-blue-100'}`}>
              {process.env.NEXT_PUBLIC_DEVELOPER_EMAIL ? (
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_DEVELOPER_EMAIL}?subject=Soporte%20Wash%20Riders`}
                  className="text-sm font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-900"
                >
                  Contactar soporte
                </a>
              ) : (
                <p className={`text-xs ${tema === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Acceso restringido al personal autorizado.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // 2. Si está autenticado, muestra el Panel con Sidebar Lateral
  return (
    <div className={`app-shell flex min-h-screen flex-col lg:flex-row ${tema === 'dark' ? 'app-theme-dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        vistaActiva={vistaActiva} 
        setVistaActiva={setVistaActiva} 
        onLogout={handleLogout} 
        tema={tema}
        onToggleTheme={cambiarTema}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-screen flex-1">
          {vistaActiva === 'dashboard' && <DashboardView onNavigate={setVistaActiva} />}
          {vistaActiva === 'productos' && <ProductosView />}
          {vistaActiva === 'ventas' && <RegistrarVentaView />}
          {(vistaActiva === 'registrar-movimiento' || vistaActiva === 'historial') && (
            <InventarioView
              vista={vistaActiva === 'historial' ? 'historial' : 'registrar'}
              onNavigate={setVistaActiva}
            />
          )}
          {vistaActiva === 'reporte-ventas' && <ReportesInventarioView modo="diario" />}
          {vistaActiva === 'pdf' && <ReportesInventarioView modo="mensual" />}
        </div>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-8">
          © {new Date().getFullYear()} WashRider. Todos los derechos reservados.
        </footer>
      </main>
    </div>
  );
}