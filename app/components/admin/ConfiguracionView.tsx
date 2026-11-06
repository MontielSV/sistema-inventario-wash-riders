'use client';
import { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  PrinterIcon, 
  TagIcon, 
  DevicePhoneMobileIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowPathIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

export default function ConfiguracionView() {
  const [config, setConfig] = useState({
    tienda_abierta: true,
    whatsapp_numero: '',
    nombre_negocio: '',
    slogan: '',
    hora_apertura: '14:00',
    hora_cierre: '23:30',
    costo_domicilio: 0,
    mensaje_whatsapp_custom: '',
    aviso_banner: '',
    formato_impresora: '58mm',
    pie_pagina_ticket: '¡Gracias por tu compra!',
    descuento_web_activo: false,
    descuento_web_porcentaje: 0
  });
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      // 🔥 FIX DE CACHÉ: Se añade un timestamp y cabeceras estrictas para evitar que Next.js o el navegador guarden los datos viejos
      const res = await fetch(`/api/configuracion?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await res.json();
      if (data) {
        setConfig({
          tienda_abierta: Boolean(data.tienda_abierta),
          whatsapp_numero: data.whatsapp_numero || '',
          nombre_negocio: data.nombre_negocio || '',
          slogan: data.slogan || '',
          hora_apertura: data.hora_apertura || '14:00',
          hora_cierre: data.hora_cierre || '23:30',
          costo_domicilio: Number(data.costo_domicilio) || 0,
          mensaje_whatsapp_custom: data.mensaje_whatsapp_custom || '',
          aviso_banner: data.aviso_banner || '',
          formato_impresora: data.formato_impresora || '58mm',
          pie_pagina_ticket: data.pie_pagina_ticket || '¡Gracias por tu compra!',
          descuento_web_activo: Boolean(data.descuento_web_activo),
          descuento_web_porcentaje: Number(data.descuento_web_porcentaje) || 0
        });
      }
    } catch (e) {
      console.error("Error cargando configuración:", e);
    } finally {
      setCargando(false);
    }
  };

  const guardarTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        const dataActualizada = await res.json();
        setConfig({
          ...config,
          descuento_web_activo: Boolean(dataActualizada.descuento_web_activo),
          descuento_web_porcentaje: Number(dataActualizada.descuento_web_porcentaje) || 0
        });
        setMensaje("Configuración global actualizada y sincronizada en tiempo real.");
        setTimeout(() => setMensaje(''), 4000);
      } else {
        setMensaje("Error al guardar los cambios.");
      }
    } catch (e) {
      setMensaje("Error de red.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoTienda = async (nuevoEstado: boolean) => {
    const datosActualizados = { ...config, tienda_abierta: nuevoEstado };
    setConfig(datosActualizados);

    try {
      await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });
      setMensaje(nuevoEstado ? "Local abierto. Clientes habilitados para comprar." : "Local cerrado. Pedidos pausados en la web.");
      setTimeout(() => setMensaje(''), 3500);
    } catch (e) {
      console.error("Error al cambiar estado:", e);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-[#E50914] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto pb-16 px-4 sm:px-0">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] font-black text-[#E50914] uppercase tracking-widest bg-red-950/40 px-3 py-1 rounded-full border border-red-500/30 inline-flex items-center gap-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5" /> Enterprise Control Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-black italic mt-2 flex items-center gap-2">
            <Cog6ToothIcon className="w-7 h-7 sm:w-8 sm:h-8 text-[#E50914] shrink-0" /> Configuración Avanzada del Negocio
          </h2>
          <p className="text-slate-400 text-xs mt-1">Parámetros operativos globales, pasarela de WhatsApp y políticas comerciales.</p>
        </div>
      </div>

      {mensaje && (
        <div className="mb-6 p-4 bg-black border border-white/20 text-white text-xs font-black rounded-2xl text-center shadow-2xl flex items-center justify-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-500" /> {mensaje}
        </div>
      )}

      <form onSubmit={guardarTodo} className="space-y-6">
        
        <div className={`p-6 sm:p-8 rounded-[2rem] border transition-all duration-500 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-6 ${
          config.tienda_abierta 
            ? 'bg-gradient-to-r from-green-950/60 via-[#181818] to-[#181818] border-green-500/50 shadow-green-950/30' 
            : 'bg-gradient-to-r from-red-950/60 via-[#181818] to-[#181818] border-red-500/50 shadow-red-950/30'
        }`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-4 text-center sm:text-left z-10">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg border shrink-0 ${config.tienda_abierta ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-red-600/20 border-red-500 text-red-400'}`}>
              {config.tienda_abierta ? <CheckCircleIcon className="w-7 h-7 text-green-400" /> : <XCircleIcon className="w-7 h-7 text-red-400" />}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border inline-block mb-1 ${config.tienda_abierta ? 'bg-green-950 text-green-400 border-green-500/30' : 'bg-red-950 text-red-400 border-red-500/30'}`}>
                {config.tienda_abierta ? 'Sistema Operativo' : 'Sistema Pausado'}
              </span>
              <h3 className="text-lg sm:text-xl font-black italic text-white">
                {config.tienda_abierta ? 'El local está recibiendo pedidos' : 'El local se encuentra cerrado'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Controla con un clic la disponibilidad instantánea de la tienda web.</p>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto z-10">
            <button 
              type="button" 
              onClick={() => cambiarEstadoTienda(true)} 
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 border flex items-center justify-center gap-1.5 ${
                config.tienda_abierta 
                  ? 'bg-green-600 text-white border-green-400 shadow-green-950/50 scale-105' 
                  : 'bg-black text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4" /> Abrir Tienda
            </button>
            <button 
              type="button" 
              onClick={() => cambiarEstadoTienda(false)} 
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 border flex items-center justify-center gap-1.5 ${
                !config.tienda_abierta 
                  ? 'bg-red-600 text-white border-red-400 shadow-red-950/50 scale-105' 
                  : 'bg-black text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <XCircleIcon className="w-4 h-4" /> Cerrar Tienda
            </button>
          </div>
        </div>

        {/* INCENTIVO MATEMÁTICO REAL */}
        <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)] space-y-4 text-xs">
          <h3 className="text-xs sm:text-sm font-black text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <TicketIcon className="w-5 h-5 shrink-0" /> Incentivo de Compra Web (Descuento Automático)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-3">Estado del Descuento Web</label>
              <button 
                type="button"
                onClick={() => setConfig({ ...config, descuento_web_activo: !config.descuento_web_activo })}
                className={`w-full px-4 py-3 rounded-xl font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                  config.descuento_web_activo 
                    ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/30' 
                    : 'bg-black text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {config.descuento_web_activo ? (
                  <><CheckCircleIcon className="w-5 h-5" /> Descuento Activado</>
                ) : (
                  <><XCircleIcon className="w-5 h-5" /> Descuento Apagado</>
                )}
              </button>
              <span className="text-[10px] text-slate-500 mt-2 block leading-relaxed">
                Si lo enciendes, se restará el porcentaje indicado al carrito de compras del cliente.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Porcentaje de Descuento (%)</label>
              <input 
                type="number"
                min="0"
                max="100"
                value={config.descuento_web_porcentaje} 
                onChange={(e) => setConfig({ ...config, descuento_web_porcentaje: Number(e.target.value) })} 
                disabled={!config.descuento_web_activo}
                className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                placeholder="Ejemplo: 10 para 10% OFF"
              />
              <span className="text-[10px] text-slate-500 mt-2 block leading-relaxed text-amber-500/70 font-bold">
                Con un 10%, un pedido de $20.000 se calculará en $18.000 reales a pagar.
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-[#E50914] uppercase tracking-wider flex items-center gap-2">
            <PrinterIcon className="w-5 h-5 shrink-0" /> Hardware: Impresoras Térmicas (Bluetooth / USB)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Formato de Papel Térmico</label>
              <select 
                value={config.formato_impresora} 
                onChange={(e) => setConfig({ ...config, formato_impresora: e.target.value })} 
                className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white font-bold outline-none focus:border-[#E50914]"
              >
                <option value="58mm">Rollos Pequeños (58mm) - Portátiles</option>
                <option value="80mm">Rollos Grandes (80mm) - Caja</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Mensaje de Despedida en el Ticket</label>
              <input 
                type="text" 
                value={config.pie_pagina_ticket} 
                onChange={(e) => setConfig({ ...config, pie_pagina_ticket: e.target.value })} 
                className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" 
              />
            </div>
          </div>
        </div>

        <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-[#E50914] uppercase tracking-wider flex items-center gap-2">
            <TagIcon className="w-5 h-5 shrink-0" /> Identidad y Marca
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Nombre del Establecimiento</label>
              <input type="text" value={config.nombre_negocio} onChange={(e) => setConfig({ ...config, nombre_negocio: e.target.value })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" required />
            </div>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Eslogan Corporativo</label>
              <input type="text" value={config.slogan} onChange={(e) => setConfig({ ...config, slogan: e.target.value })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
            </div>
          </div>
        </div>

        <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-[#E50914] uppercase tracking-wider flex items-center gap-2">
            <DevicePhoneMobileIcon className="w-5 h-5 shrink-0" /> Pasarela de Pedidos por WhatsApp
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Número Oficial de WhatsApp</label>
              <input type="text" value={config.whatsapp_numero} onChange={(e) => setConfig({ ...config, whatsapp_numero: e.target.value })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" required />
            </div>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Encabezado Personalizado del Mensaje</label>
              <input type="text" value={config.mensaje_whatsapp_custom} onChange={(e) => setConfig({ ...config, mensaje_whatsapp_custom: e.target.value })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
            </div>
          </div>
        </div>

        <div className="bg-[#181818] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-4 text-xs">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-[#E50914] shrink-0" /> Horarios y Políticas Comerciales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Apertura Diaria</label>
              <input type="time" value={config.hora_apertura} onChange={(e) => setConfig({ ...config, hora_apertura: e.target.value })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Cierre Diario</label>
              <input type="time" value={config.hora_cierre} onChange={(e) => setConfig({ ...config, hora_cierre: e.target.value })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-400 uppercase mb-1.5">Costo Base Domicilio (COP)</label>
              <input type="number" min="0" value={config.costo_domicilio} onChange={(e) => setConfig({ ...config, costo_domicilio: Number(e.target.value) })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1.5">Aviso o Banner Global en la Web</label>
            <textarea rows={2} value={config.aviso_banner} onChange={(e) => setConfig({ ...config, aviso_banner: e.target.value })} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914] resize-none" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={guardando} 
          className="w-full bg-[#E50914] hover:bg-red-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-red-950/60 transition-all disabled:opacity-50 text-xs sm:text-sm active:scale-95 flex items-center justify-center gap-2"
        >
          {guardando ? (
            <><ArrowPathIcon className="w-5 h-5 animate-spin" /> Sincronizando Base de Datos...</>
          ) : (
            <><CheckIcon className="w-5 h-5" /> Guardar Toda la Configuración Global</>
          )}
        </button>

      </form>
    </div>
  );
}