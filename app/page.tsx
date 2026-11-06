'use client';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/admin/DashboardView';
import ProductosView from './components/admin/ProductosView';
import InventarioView from './components/admin/InventarioView';
import RegistrarVentaView from './components/admin/RegistrarVentaView';
import ReportesInventarioView from './components/admin/ReportesInventarioView';
import { CubeIcon, LockClosedIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';

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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf4fb] px-4 py-8 text-slate-900 sm:px-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-[#1f5a8a]" />
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#d9e5ef] bg-white shadow-[0_28px_90px_-42px_rgba(17,54,88,0.35)] md:min-h-[560px] md:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#123b60] p-10 text-white md:flex lg:p-12">
            <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 bg-white/10">
                  <CubeIcon className="h-6 w-6 text-white" />
                </span>
                <span className="text-sm font-black uppercase tracking-[0.14em]">Wash Riders</span>
              </div>
              <div className="mt-20 max-w-xs">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Inventario</p>
                <h1 className="mt-4 text-4xl font-black leading-tight">Panel de administración</h1>
                <div className="mt-6 h-1 w-14 rounded-full bg-[#e50914]" />
              </div>
            </div>
            <div className="relative flex items-center gap-2 border-t border-white/15 pt-5 text-xs font-medium text-blue-100">
              <ShieldCheckIcon className="h-4 w-4" /> Acceso seguro para personal autorizado
            </div>
          </aside>

          <section aria-labelledby="login-title" className="flex flex-col justify-center px-6 py-10 sm:px-12 md:px-12 lg:px-16">
            <div className="mb-9 flex items-center gap-3 md:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#123b60] text-white">
                <CubeIcon className="h-5 w-5" />
              </span>
              <span className="text-sm font-black uppercase tracking-[0.12em] text-[#123b60]">Wash Riders</span>
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2c6b9b]">Bienvenido</p>
              <h2 id="login-title" className="mt-2 text-3xl font-black tracking-tight text-[#183b58]">Iniciar sesión</h2>
              <p className="mt-2 text-sm text-slate-500">Ingresa tus credenciales para continuar.</p>
            </div>

            {errorLogin && (
              <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorLogin}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-usuario" className="mb-2 block text-sm font-semibold text-slate-700">Usuario</label>
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
                    className="w-full rounded-lg border border-[#d5e1eb] bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#3478a9] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label>
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
                    className="w-full rounded-lg border border-[#d5e1eb] bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#3478a9] focus:ring-4 focus:ring-blue-100"
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

            <div className="mt-7 border-t border-slate-100 pt-5">
              {process.env.NEXT_PUBLIC_DEVELOPER_EMAIL ? (
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_DEVELOPER_EMAIL}?subject=Soporte%20Wash%20Riders`}
                  className="text-sm font-semibold text-[#2c6b9b] underline decoration-blue-200 underline-offset-4 transition hover:text-[#123b60]"
                >
                  Contactar soporte
                </a>
              ) : (
                <p className="text-xs text-slate-400">Acceso restringido al personal autorizado.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // 2. Si está autenticado, muestra el Panel con Sidebar Lateral
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <Sidebar 
        vistaActiva={vistaActiva} 
        setVistaActiva={setVistaActiva} 
        onLogout={handleLogout} 
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {vistaActiva === 'dashboard' && <DashboardView onNavigate={setVistaActiva} />}
        {vistaActiva === 'productos' && <ProductosView />}
        {vistaActiva === 'ventas' && <RegistrarVentaView />}
        {vistaActiva === 'historial' && <InventarioView />}
        {vistaActiva === 'reporte-ventas' && <ReportesInventarioView modo="diario" />}
        {vistaActiva === 'pdf' && <ReportesInventarioView modo="mensual" />}
      </main>
    </div>
  );
}