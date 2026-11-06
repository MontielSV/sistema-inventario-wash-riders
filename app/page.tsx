'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ArrowRightIcon, 
  BuildingStorefrontIcon, 
  BookOpenIcon, 
  FireIcon,
  SparklesIcon,
  MapPinIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

export default function Inicio() {
  const router = useRouter();
  const [clicksLogo, setClicksLogo] = useState(0);
  const [menuLateralAbierto, setMenuLateralAbierto] = useState(false);

  // 3 clics en el logo llevan al panel de admin
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
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* BOTÓN HAMBURGUESA LATERAL */}
            <button 
              onClick={() => setMenuLateralAbierto(true)}
              className="w-11 h-11 bg-[#222222] hover:bg-[#2A2A2A] rounded-2xl border border-white/10 flex items-center justify-center transition-all group active:scale-95 shadow-md text-slate-300 hover:text-[#E50914] shrink-0"
              title="Abrir menú"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                <Bars3Icon className="w-5 h-5 shrink-0" />
              </span>
            </button>

            {/* LOGO */}
            <div 
              onClick={manejarClickLogo} 
              className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
              title="Mr Kings Arepa"
            >
              <div className="w-11 h-11 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 group-hover:border-[#E50914] transition-all duration-300 shrink-0">
                <img src="/logo.png" alt="Mr Kings Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-white text-lg tracking-wider block leading-none group-hover:text-[#E50914] transition-colors">MR KINGS</span>
                <span className="text-[10px] text-[#E50914] font-bold tracking-widest uppercase">Sabor de Sofi</span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/nosotros" className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold text-slate-300 hover:text-white bg-[#222222] hover:bg-[#2A2A2A] px-3 sm:px-5 py-2.5 rounded-xl transition-all border border-white/10 shadow-sm shrink-0">
              <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                <BookOpenIcon className="w-4 h-4 shrink-0" />
              </span>
              <span className="hidden min-[400px]:inline">Nuestra Historia</span> 
              <span className="min-[400px]:hidden">Nosotros</span> 
            </Link>
            <Link href="/menu" className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-black text-white bg-[#E50914] hover:bg-[#b80710] px-3 sm:px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-red-950/50 hover:scale-105 active:scale-95 shrink-0">
              <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                <ShoppingBagIcon className="w-4 h-4 shrink-0" />
              </span>
              <span>Pedir Ahora</span> 
            </Link>
          </nav>
        </div>
      </header>

      {/* MENÚ LATERAL HAMBURGUESA DESPLEGABLE */}
      {menuLateralAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            onClick={() => setMenuLateralAbierto(false)} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="relative w-80 max-w-[80vw] bg-[#181818] border-r border-white/10 h-full shadow-2xl z-50 flex flex-col justify-between p-6 animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/25 shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h3 className="font-black text-white tracking-wider text-sm">MR KINGS AREPA</h3>
                    <span className="text-[10px] text-[#E50914] font-bold uppercase tracking-widest">Navegación</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMenuLateralAbierto(false)}
                  className="w-9 h-9 bg-black hover:bg-red-950 text-white rounded-xl border border-white/10 flex items-center justify-center transition-colors shrink-0"
                >
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <XMarkIcon className="w-5 h-5 shrink-0" />
                  </span>
                </button>
              </div>

              <div className="space-y-3 font-bold text-sm">
                <Link href="/" onClick={() => setMenuLateralAbierto(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-black/40 hover:bg-[#E50914] text-slate-200 hover:text-white transition-all border border-white/5">
                   <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-[#E50914] group-hover:text-white">
                     <BuildingStorefrontIcon className="w-5 h-5 shrink-0" />
                   </span>
                   <span>Inicio</span>
                </Link>
                <Link href="/menu" onClick={() => setMenuLateralAbierto(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-black/40 hover:bg-[#E50914] text-slate-200 hover:text-white transition-all border border-white/5">
                   <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-[#E50914] group-hover:text-white">
                     <SparklesIcon className="w-5 h-5 shrink-0" />
                   </span>
                   <span>Ver Menú Completo</span>
                </Link>
                <Link href="/nosotros" onClick={() => setMenuLateralAbierto(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-black/40 hover:bg-[#E50914] text-slate-200 hover:text-white transition-all border border-white/5">
                   <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-[#E50914] group-hover:text-white">
                     <BookOpenIcon className="w-5 h-5 shrink-0" />
                   </span>
                   <span>Nuestra Historia</span>
                </Link>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-3">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Síguenos</span>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/mr.king.arepa?igsi=M3dnaTlhb2hrcmdy&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-black border border-white/10 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-500/50 transition-all shrink-0">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.555.556.9 1.11 1.152 1.772.246.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>
                </a>
                <a href="https://www.facebook.com/share/19ZY2eiVTX/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-black border border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all shrink-0">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg>
                </a>
                <a href="https://www.tiktok.com/@mr.king.arepa?_r=1&_t=ZS-99FOFJzFi2m" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-black border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/50 transition-all shrink-0">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.37.59-4.74 2.37-6.3 1.05-.92 2.39-1.47 3.77-1.54 1.04-.04 2.08.16 3.03.54v4.29c-.3-.15-.65-.24-.99-.28-.35-.04-.7-.03-1.04.05-.98.24-1.79.99-2.12 1.92-.35.98-.18 2.11.45 2.93.6.76 1.54 1.18 2.51 1.19 1.15.02 2.22-.52 2.87-1.42.34-.48.55-1.06.59-1.66.09-3.71.04-7.42.06-11.13z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN HERO PRINCIPAL */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-16">
        <div className="bg-gradient-to-br from-[#1F1F1F] via-[#1A1A1A] to-[#141414] rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid lg:grid-cols-12 gap-8 items-center p-8 sm:p-14 relative group">
          
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#E50914]/20 transition-all duration-700"></div>

          <div className="lg:col-span-7 space-y-6 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#E50914]/10 border border-[#E50914]/30 px-4 py-1.5 rounded-full shadow-inner animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0"></span>
              <span className="text-xs font-black text-[#E50914] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center shrink-0">
                  <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                </span>
                Abierto en Bogotá
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none italic uppercase">
              EL REY DE LAS <span className="text-[#E50914] underline decoration-red-600/60 underline-offset-8">AREPAS</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              Disfruta de la verdadera comida rápida artesanal. Ingredientes frescos seleccionados, porciones contundentes y el toque único de <strong className="text-white">Sabor de Sofi</strong> directo a tu puerta.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/menu" className="w-full sm:w-auto bg-[#E50914] hover:bg-[#b80710] text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-red-950/40 text-base text-center transition-all duration-300 hover:scale-105 active:scale-95 border border-red-500/50 flex items-center justify-center gap-3 group/btn">
                <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                  <ShoppingBagIcon className="w-5 h-5 shrink-0" />
                </span>
                <span>Pedir Ahora</span>
              </Link>
              
              <Link href="/nosotros" className="w-full sm:w-auto bg-[#222222] hover:bg-[#2A2A2A] text-white font-bold py-4 px-8 rounded-2xl shadow-lg text-base text-center transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10 flex items-center justify-center gap-3">
                <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-slate-300">
                  <BookOpenIcon className="w-5 h-5 shrink-0" />
                </span>
                <span>Nuestra Historia</span>
              </Link>
            </div>
          </div>

          <div 
            onClick={manejarClickLogo}
            className="lg:col-span-5 relative flex items-center justify-center cursor-pointer group/banner"
          >
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-[#E50914]/20 rounded-full blur-3xl group-hover/banner:bg-[#E50914]/40 transition-all duration-500"></div>
            
            <div className="relative z-10 w-full h-72 sm:h-[400px] bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm rounded-3xl border border-white/15 p-6 flex flex-col items-center justify-end shadow-2xl overflow-hidden group-hover/banner:scale-105 group-hover/banner:border-red-500/50 transition-all duration-500">
              <img 
                src="/logo.png" 
                alt="Mr Kings Arepa Producto Estrella" 
                className="absolute inset-0 w-full h-full object-contain p-8 drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)] transform group-hover/banner:scale-110 group-hover/banner:rotate-2 transition-transform duration-700" 
              />
              
              <div className="relative w-full bg-black/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex justify-between items-center text-xs font-bold shadow-lg transform translate-y-2 group-hover/banner:translate-y-0 transition-transform">
                <span className="text-white flex items-center gap-2">
                  <span className="w-4 h-4 inline-flex items-center justify-center text-[#E50914] shrink-0">
                    <FireIcon className="w-4 h-4 shrink-0" />
                  </span> 
                  <span className="hidden sm:inline">Pedido 100% en línea</span>
                </span>
                <span className="text-[#E50914] uppercase tracking-wider bg-red-950/50 px-3 py-1.5 rounded-lg border border-red-500/30 animate-pulse flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 inline-flex items-center justify-center shrink-0">
                    <FireIcon className="w-3.5 h-3.5 shrink-0" />
                  </span>
                  ¡Pídelo hoy!
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECCIÓN DE ESPECIALIDADES */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-black text-[#E50914] uppercase tracking-widest">Nuestras Creaciones</span>
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-wide mt-1 flex items-center gap-2">
              <span>Especialidades</span>
              <span className="w-6 h-6 inline-flex items-center justify-center text-[#E50914] shrink-0">
                <SparklesIcon className="w-6 h-6 shrink-0" />
              </span>
            </h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <Link href="/menu" className="bg-[#181818] hover:bg-[#1F1F1F] border border-white/10 hover:border-red-600/50 p-8 rounded-3xl transition-all duration-300 shadow-xl group flex flex-col justify-between hover:-translate-y-3 hover:shadow-2xl hover:shadow-red-950/30">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-black to-[#1a1a1a] rounded-2xl border border-white/10 flex items-center justify-center text-[#E50914] mb-6 group-hover:scale-110 group-hover:bg-[#E50914]/20 transition-all shadow-inner shrink-0">
                <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
                  <BuildingStorefrontIcon className="w-6 h-6 shrink-0" />
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#E50914] uppercase tracking-widest bg-red-950/40 px-2.5 py-1 rounded-md border border-red-500/20 inline-block mb-3">Artesanales</span>
              <h3 className="text-2xl font-black mt-1 group-hover:text-[#E50914] transition-colors">Arepas Rellenas</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">Maíz seleccionado con carnes jugosas y quesos fundidos al instante.</p>
            </div>
          </Link>

          <Link href="/menu" className="bg-[#181818] hover:bg-[#1F1F1F] border border-white/10 hover:border-red-600/50 p-8 rounded-3xl transition-all duration-300 shadow-xl group flex flex-col justify-between hover:-translate-y-3 hover:shadow-2xl hover:shadow-red-950/30">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-black to-[#1a1a1a] rounded-2xl border border-white/10 flex items-center justify-center text-[#E50914] mb-6 group-hover:scale-110 group-hover:bg-[#E50914]/20 transition-all shadow-inner shrink-0">
                <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
                  <FireIcon className="w-6 h-6 shrink-0" />
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#E50914] uppercase tracking-widest bg-red-950/40 px-2.5 py-1 rounded-md border border-red-500/20 inline-block mb-3">A la Parrilla</span>
              <h3 className="text-2xl font-black mt-1 group-hover:text-[#E50914] transition-colors">Hamburguesas</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">Pan suave, carne 100% de res, tocineta crujiente y salsa secreta.</p>
            </div>
          </Link>

          <Link href="/menu" className="bg-[#181818] hover:bg-[#1F1F1F] border border-white/10 hover:border-red-600/50 p-8 rounded-3xl transition-all duration-300 shadow-xl group flex flex-col justify-between hover:-translate-y-3 hover:shadow-2xl hover:shadow-red-950/30">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-black to-[#1a1a1a] rounded-2xl border border-white/10 flex items-center justify-center text-[#E50914] mb-6 group-hover:scale-110 group-hover:bg-[#E50914]/20 transition-all shadow-inner shrink-0">
                <span className="w-6 h-6 inline-flex items-center justify-center shrink-0">
                  <SparklesIcon className="w-6 h-6 shrink-0" />
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#E50914] uppercase tracking-widest bg-red-950/40 px-2.5 py-1 rounded-md border border-red-500/20 inline-block mb-3">Crujientes</span>
              <h3 className="text-2xl font-black mt-1 group-hover:text-[#E50914] transition-colors">Empanadas & Más</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">El complemento perfecto, porciones doradas y llenas de sabor.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* SECCIÓN: REDES SOCIALES Y COMUNIDAD CON LOGOS OFICIALES SVG */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 mt-8">
        <div className="bg-[#181818] rounded-3xl border border-white/10 p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase relative z-10">Únete a nuestra comunidad</h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-lg mx-auto relative z-10">
            Síguenos en nuestras redes sociales para enterarte de promociones, nuevos productos y ver cómo preparamos tu comida favorita.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 relative z-10">
            {/* Instagram SVG Oficial */}
            <a href="https://www.instagram.com/mr.king.arepa?igsi=M3dnaTlhb2hrcmdy&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-slate-300 w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-2xl border border-white/10 flex items-center justify-center hover:text-white hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-500 hover:to-purple-600 hover:border-transparent transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/30 shrink-0">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.555.556.9 1.11 1.152 1.772.246.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>
            </a>
            {/* Facebook SVG Oficial */}
            <a href="https://www.facebook.com/share/19ZY2eiVTX/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-slate-300 w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-2xl border border-white/10 flex items-center justify-center hover:text-white hover:bg-blue-600 hover:border-transparent transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-600/30 shrink-0">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg>
            </a>
            {/* TikTok SVG Oficial */}
            <a href="https://www.tiktok.com/@mr.king.arepa?_r=1&_t=ZS-99FOFJzFi2m" target="_blank" rel="noopener noreferrer" className="text-slate-300 w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-2xl border border-white/10 flex items-center justify-center hover:text-white hover:bg-slate-800 hover:border-transparent transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/20 shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.24-2.37.59-4.74 2.37-6.3 1.05-.92 2.39-1.47 3.77-1.54 1.04-.04 2.08.16 3.03.54v4.29c-.3-.15-.65-.24-.99-.28-.35-.04-.7-.03-1.04.05-.98.24-1.79.99-2.12 1.92-.35.98-.18 2.11.45 2.93.6.76 1.54 1.18 2.51 1.19 1.15.02 2.22-.52 2.87-1.42.34-.48.55-1.06.59-1.66.09-3.71.04-7.42.06-11.13z"/></svg>
            </a>
            {/* WhatsApp Oficial */}
            <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer" className="text-slate-300 w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-2xl border border-white/10 flex items-center justify-center hover:text-white hover:bg-green-500 hover:border-transparent transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/30 shrink-0">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER CORPORATIVO */}
      <footer className="w-full bg-[#141414] border-t border-white/10 mt-8 pt-14 pb-8 px-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-center md:text-left">
          
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-9 h-9 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/25 shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
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
              <li><Link href="/nosotros" className="hover:text-white transition-colors">Nuestra Historia</Link></li>
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
          <div className="flex gap-4 mt-2 sm:mt-0">
            <a href="https://www.instagram.com/mr.king.arepa?igsi=M3dnaTlhb2hrcmdy&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href="https://www.facebook.com/share/19ZY2eiVTX/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
            <a href="https://www.tiktok.com/@mr.king.arepa?_r=1&_t=ZS-99FOFJzFi2m" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok</a>
          </div>
        </div>
      </footer>

    </main>
  );
}