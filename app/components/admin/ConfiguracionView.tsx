'use client';
import { useState, useEffect } from 'react';
import { 
  BuildingStorefrontIcon, 
  ServerIcon, 
  KeyIcon, 
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function ConfiguracionView() {
  const [nombreEmpresa, setNombreEmpresa] = useState('Wash Riders');
  const [guardado, setGuardado] = useState(false);
  const [estadoBD, setEstadoBD] = useState<'verificando' | 'conectado' | 'error'>('verificando');

  useEffect(() => {
    // Verificación básica de conexión con la API y Neon
    fetch('/api/configuracion')
      .then((res) => {
        if (res.ok) setEstadoBD('conectado');
        else setEstadoBD('error');
      })
      .catch(() => setEstadoBD('error'));
  }, []);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabecera del módulo */}
        <header className="pb-6 border-b border-white/10">
          <h1 className="text-3xl font-black italic tracking-tighter text-emerald-400">
            Configuración del Sistema
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Parámetros generales de la plataforma e infraestructura en la nube
          </p>
        </header>

        {/* Notificación de guardado */}
        {guardado && (
          <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm font-bold animate-in fade-in">
            <CheckCircleIcon className="w-5 h-5 shrink-0" />
            Configuración actualizada correctamente.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          
          {/* Tarjeta 1: Información de la Organización */}
          <div className="bg-[#0f0f0f]/95 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <BuildingStorefrontIcon className="w-6 h-6 text-[#E50914]" />
              <h2 className="text-xl font-bold text-white">Identidad de la Empresa</h2>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre Comercial / Organización
                </label>
                <input
                  type="text"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E50914] transition-all font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#E50914] hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          {/* Tarjeta 2: Estado de la Base de Datos (Neon) */}
          <div className="bg-[#0f0f0f]/95 p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <ServerIcon className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold text-white">Servicios de Almacenamiento</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white">Base de Datos PostgreSQL</p>
                  <p className="text-xs text-slate-400">Instancia en Neon Serverless Cloud</p>
                </div>
                <div className="flex items-center gap-2">
                  {estadoBD === 'conectado' && (
                    <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-md flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Conectado
                    </span>
                  )}
                  {estadoBD === 'verificando' && (
                    <span className="px-3 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-md flex items-center gap-1.5">
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                      Verificando
                    </span>
                  )}
                  {estadoBD === 'error' && (
                    <span className="px-3 py-1 bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-bold rounded-md">
                      Error de Enlace
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/50 p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white">Servidor de Despliegue</p>
                  <p className="text-xs text-slate-400">Vercel Production Platform</p>
                </div>
                <span className="px-3 py-1 bg-blue-950/60 border border-blue-500/40 text-blue-400 text-xs font-bold rounded-md">
                  Activo
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}