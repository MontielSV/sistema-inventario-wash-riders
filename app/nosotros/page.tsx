'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BuildingStorefrontIcon, 
  BookOpenIcon, 
  MapPinIcon, 
  ClockIcon, 
  RocketLaunchIcon, 
  SparklesIcon, 
  FireIcon, 
  ComputerDesktopIcon, 
  Bars3Icon, 
  XMarkIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

export default function Nosotros() {
  const router = useRouter();
  const [clicksLogo, setClicksLogo] = useState(0);
  const [menuLateralAbierto, setMenuLateralAbierto] = useState(false);

  // Clic para acceder al panel de administrador
  const manejarClickLogo = () => {
    const nuevosClicks = clicksLogo + 1;
    setClicksLogo(nuevosClicks);
    if (nuevosClicks >= 3) {
      router.push('/admin');
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-[#E50914] selection:text-white overflow-x-hidden font-sans">
      
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <header className="w-full bg-[#181818]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-4 sm:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMenuLateralAbierto(true)}
              className="w-11 h-11 bg-[#222222] hover:bg-[#2A2A2A] rounded-2xl border border-white/10 flex items-center justify-center transition-all group active:scale-95 shadow-md text-slate-300 hover:text-[#E50914]"
              title="Abrir menú"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                <Bars3Icon className="w-5 h-5" />
              </span>
            </button>

            <div 
              onClick={manejarClickLogo} 
              className="flex items-center gap-3 cursor-pointer select-none group"
              title="Mr Kings Arepa"
            >
              <div className="w-11 h-11 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 group-hover:border-[#E50914] transition-all duration-300 p-1">
                <img src="/logo.png" alt="Mr Kings Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-white text-lg tracking-wider block leading-none group-hover:text-[#E50914] transition-colors">MR KINGS</span>
                <span className="text-[10px] text-[#E50914] font-bold tracking-widest uppercase">Sabor de Sofi</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link href="/" className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-[#222222] hover:bg-[#2A2A2A] px-5 py-2.5 rounded-xl transition-all border border-white/10 shadow-sm hover:scale-105 active:scale-95 flex items-center gap-2">
              <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                <ArrowLeftIcon className="w-4 h-4" />
              </span>
              <span>Volver al Inicio</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* MENÚ LATERAL HAMBURGUESA DESPLEGABLE */}
      {menuLateralAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div onClick={() => setMenuLateralAbierto(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>
          <div className="relative w-80 max-w-[80vw] bg-[#181818] border-r border-white/10 h-full shadow-2xl z-50 flex flex-col justify-between p-6 animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/20 p-1">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-black text-white tracking-wider text-sm">MR KINGS AREPA</h3>
                    <span className="text-[10px] text-[#E50914] font-bold uppercase">Navegación</span>
                  </div>
                </div>
                <button onClick={() => setMenuLateralAbierto(false)} className="w-9 h-9 bg-black hover:bg-[#E50914] text-white rounded-xl border border-white/10 flex items-center justify-center transition-colors">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <XMarkIcon className="w-5 h-5" />
                  </span>
                </button>
              </div>
              <div className="space-y-3 font-bold text-sm">
                <Link href="/" onClick={() => setMenuLateralAbierto(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-black/40 hover:bg-[#E50914] text-slate-200 hover:text-white transition-all border border-white/5">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-[#E50914]">
                    <BuildingStorefrontIcon className="w-5 h-5" />
                  </span>
                  <span>Inicio</span>
                </Link>
                <Link href="/menu" onClick={() => setMenuLateralAbierto(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-black/40 hover:bg-[#E50914] text-slate-200 hover:text-white transition-all border border-white/5">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-[#E50914]">
                    <RocketLaunchIcon className="w-5 h-5" />
                  </span>
                  <span>Ver Menú Completo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL "NOSOTROS" */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 my-auto">
        
        {/* Encabezado */}
        <div className="text-center space-y-3 mb-10">
          <span className="inline-block text-xs font-black text-[#E50914] uppercase tracking-widest bg-[#E50914]/10 px-4 py-1.5 rounded-full border border-[#E50914]/30 animate-pulse">
            Nuestra Esencia
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight italic uppercase">
            TRADICIÓN Y <span className="text-[#E50914] underline decoration-red-600/60 underline-offset-8">TECNOLOGÍA</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Conoce la historia detrás del sabor que conquista Bogotá y la innovación digital que impulsa nuestro negocio.
          </p>
        </div>

        {/* Tarjeta Gigante Principal (Historia) */}
        <div className="bg-gradient-to-br from-[#1F1F1F] via-[#1A1A1A] to-[#141414] rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid md:grid-cols-12 gap-8 items-center p-8 sm:p-12 relative group mb-12">
          
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#E50914]/20 transition-all duration-700"></div>

          <div className="md:col-span-7 space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase">
              El Sueño de <span className="text-[#E50914]">Sabor de Sofi</span>
            </h2>
            <p>
              <strong className="text-white">Mr Kings Arepa</strong> nació del esfuerzo familiar y del talento indiscutible para transformar ingredientes frescos en una experiencia única para el paladar en Bogotá.
            </p>
            <p>
              Bajo el sello de calidad de <strong className="text-white">"Sabor de Sofi"</strong>, cada plato es preparado de forma artesanal, honrando las recetas tradicionales pero aportando un toque contundente y moderno que nos distingue.
            </p>
            <p>
              Este sistema web interactivo fue diseñado como parte de un proyecto de ingeniería de software para optimizar la gestión de pedidos, automatizar canales de entrega y modernizar la experiencia del cliente.
            </p>
          </div>

          <div className="md:col-span-5 relative flex items-center justify-center">
            <div className="absolute w-64 h-64 bg-[#E50914]/20 rounded-full blur-3xl"></div>
            <div className="relative z-10 w-full h-72 sm:h-80 bg-black/60 backdrop-blur-md rounded-3xl border border-white/15 p-6 flex flex-col items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
              <img src="/logo.png" alt="Mr Kings Logo" className="w-40 h-40 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)] mb-4" />
            </div>
          </div>
        </div>

        {/* Tarjetas de Pilares */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          <div className="bg-[#181818] hover:bg-[#1F1F1F] border border-white/10 hover:border-red-600/50 p-7 rounded-3xl transition-all duration-300 shadow-xl group hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/30">
            <div className="w-12 h-12 bg-black rounded-2xl border border-white/10 flex items-center justify-center text-[#E50914] mb-4 group-hover:scale-110 group-hover:bg-[#E50914]/20 transition-all">
              <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
                <SparklesIcon className="w-6 h-6" />
              </span>
            </div>
            <h3 className="text-lg font-black text-white group-hover:text-[#E50914] transition-colors mb-2">Ingredientes Frescos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Seleccionamos los mejores insumos del mercado para garantizar calidad absoluta en cada plato.</p>
          </div>

          <div className="bg-[#181818] hover:bg-[#1F1F1F] border border-white/10 hover:border-red-600/50 p-7 rounded-3xl transition-all duration-300 shadow-xl group hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/30">
            <div className="w-12 h-12 bg-black rounded-2xl border border-white/10 flex items-center justify-center text-[#E50914] mb-4 group-hover:scale-110 group-hover:bg-[#E50914]/20 transition-all">
              <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
                <FireIcon className="w-6 h-6" />
              </span>
            </div>
            <h3 className="text-lg font-black text-white group-hover:text-[#E50914] transition-colors mb-2">Preparación al Instante</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Nada precalentado. Cada arepa y hamburguesa se elabora en el momento de tu pedido.</p>
          </div>

          <div className="bg-[#181818] hover:bg-[#1F1F1F] border border-white/10 hover:border-red-600/50 p-7 rounded-3xl transition-all duration-300 shadow-xl group hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/30">
            <div className="w-12 h-12 bg-black rounded-2xl border border-white/10 flex items-center justify-center text-[#E50914] mb-4 group-hover:scale-110 group-hover:bg-[#E50914]/20 transition-all">
              <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
                <ComputerDesktopIcon className="w-6 h-6" />
              </span>
            </div>
            <h3 className="text-lg font-black text-white group-hover:text-[#E50914] transition-colors mb-2">Tecnología Web</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Plataforma optimizada para una experiencia de usuario rápida, fluida y directa.</p>
          </div>
        </div>

        {/* UBICACIÓN Y MAPA */}
        <div className="bg-[#181818] rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E50914]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            {/* Detalles de contacto */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black italic uppercase text-white mb-2">Visítanos</h2>
                <p className="text-slate-400 text-sm">Ven a disfrutar del auténtico Sabor de Sofi o pide a domicilio.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/20 flex items-center justify-center text-[#E50914] shrink-0">
                    <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                      <MapPinIcon className="w-5 h-5" />
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Dirección Principal</h4>
                    <p className="text-slate-400 text-xs mt-1">Bogotá, Colombia Calle 23d # 104 a 25</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/20 flex items-center justify-center text-[#E50914] shrink-0">
                    <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                      <ClockIcon className="w-5 h-5" />
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Horarios de Atención</h4>
                    <p className="text-slate-400 text-xs mt-1">Lunes a Domingo<br/>2:00 PM - 11:30 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenedor del Mapa Interactivo Oficial de Google Maps */}
            <div className="w-full h-64 sm:h-[350px] bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-inner group-hover:border-[#E50914]/50 transition-colors duration-500">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.657593284042!2d-74.1424014!3d4.6828396!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9c91347b9edb%3A0x2142d6d49b79fc88!2sMr%20King%C2%B4s%20Arepa!5e0!3m2!1ses-419!2sco!4v1715000000000!5m2!1ses-419!2sco" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="opacity-80 group-hover:opacity-100 transition-opacity duration-500 filter contrast-125"
              ></iframe>
              <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#E50914] shadow-xl pointer-events-none">
                Mapa Interactivo
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* FOOTER CORPORATIVO */}
      <footer className="w-full bg-[#141414] border-t border-white/10 mt-8 pt-14 pb-8 px-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-center md:text-left">
          
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-9 h-9 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/20 p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-black text-white text-base tracking-wider">MR KINGS AREPA</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px] max-w-xs mx-auto md:mx-0">
              El auténtico Sabor de Sofi. Calidad artesanal y tecnología web avanzada al servicio de la comida rápida en Bogotá.
            </p>
          </div>

          <div>
            <h4 className="font-black text-white uppercase tracking-wider mb-3 text-sm">Enlaces Rápidos</h4>
            <ul className="space-y-2 font-medium">
              <li><Link href="/menu" className="hover:text-white transition-colors">Ver Menú Digital</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Página Principal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white uppercase tracking-wider mb-3 text-sm">Ubicación y Soporte</h4>
            <ul className="space-y-2 font-medium">
              <li>Bogotá, Colombia</li>
              <li>Pedidos en línea activos en los horarios designados.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white uppercase tracking-wider mb-3 text-sm">Proyecto</h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Tecnología en Desarrollo de Software<br />
              Fase inicial y con nuevas implementaciones a futuro
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center text-center gap-4 text-[11px] text-slate-500 font-bold">
          <p>© 2026 Mr Kings Arepa. Todos los derechos reservados.</p>
          <p className="text-[#E50914]">Desarrollado por Edison Amado</p>
        </div>
      </footer>

    </main>
  );
}