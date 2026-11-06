'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBagIcon, 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon, 
  BuildingStorefrontIcon, 
  BookOpenIcon, 
  ShieldCheckIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  DevicePhoneMobileIcon, 
  MapPinIcon, 
  UserIcon, 
  PhoneIcon, 
  DocumentTextIcon, 
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  TicketIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Menu() {
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [montado, setMontado] = useState(false);

  // Estados de Configuración Dinámica del Negocio
  const [configNegocio, setConfigNegocio] = useState({
    tienda_abierta: true,
    whatsapp_numero: '573000000000',
    nombre_negocio: 'Mr Kings Arepa',
    descuento_web_activo: false,
    descuento_web_porcentaje: 0
  });

  // Navegación
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [menuLateralAbierto, setMenuLateralAbierto] = useState(false);
  const [clicksLogo, setClicksLogo] = useState(0);

  // Carrito y Control de Pasos (Paso 1: Revisar items, Paso 2: Datos y Pago)
  const [carrito, setCarrito] = useState<any[]>([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [pasoCheckout, setPasoCheckout] = useState(1); 

  // Datos del Formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  // Click logo acceso panel admin
  const manejarClickLogo = () => {
    const nuevosClicks = clicksLogo + 1;
    setClicksLogo(nuevosClicks);
    if (nuevosClicks >= 3) router.push('/admin');
  };

  useEffect(() => {
    setMontado(true);
    if (typeof window !== 'undefined') {
      const guardado = localStorage.getItem('mrkings_carrito');
      if (guardado) {
        try { setCarrito(JSON.parse(guardado)); } catch (e) { console.error(e); }
      }
    }

    const obtenerDatosGlobales = async () => {
      try {
        const resProd = await fetch(`/api/productos?t=${new Date().getTime()}`, { cache: 'no-store' }); 
        const dataProd = await resProd.json();
        setProductos(dataProd);

        const resConf = await fetch(`/api/configuracion?t=${new Date().getTime()}`, { cache: 'no-store' });
        const dataConf = await resConf.json();
        if (dataConf) {
          setConfigNegocio({
            tienda_abierta: dataConf.tienda_abierta ?? true,
            whatsapp_numero: dataConf.whatsapp_numero || '573000000000',
            nombre_negocio: dataConf.nombre_negocio || 'Mr Kings Arepa',
            descuento_web_activo: Boolean(dataConf.descuento_web_activo),
            descuento_web_porcentaje: Number(dataConf.descuento_web_porcentaje) || 0
          });
        }
      } catch (error) {
        console.error("Error sincronizando datos:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosGlobales();
    const intervalo = setInterval(obtenerDatosGlobales, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (montado && typeof window !== 'undefined') {
      localStorage.setItem('mrkings_carrito', JSON.stringify(carrito));
    }
  }, [carrito, montado]);

  useEffect(() => {
    if (carrito.length === 0 && mostrarCarrito) {
      setMostrarCarrito(false);
      setPasoCheckout(1);
    }
  }, [carrito.length, mostrarCarrito]);

  const agregarAlCarrito = (item: any) => {
    if (!configNegocio.tienda_abierta) {
      alert("Lo sentimos, el local se encuentra cerrado en este momento.");
      return;
    }
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === item.id);
      if (existe) return prev.map((p) => p.id === item.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id: number, delta: number) => {
    setCarrito((prev) => prev.map((p) => {
      if (p.id === id) {
        const nueva = p.cantidad + delta;
        return nueva > 0 ? { ...p, cantidad: nueva } : null;
      }
      return p;
    }).filter(Boolean));
  };

  const vaciarCarrito = () => { 
    if (confirm("¿Estás seguro de que deseas vaciar tu pedido?")) {
      setCarrito([]);
      setPasoCheckout(1);
    }
  };

  // 🧮 LÓGICA MATEMÁTICA DE DESCUENTOS
  const subtotalCarrito = carrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
  const porcentajeDescuento = configNegocio.descuento_web_activo ? configNegocio.descuento_web_porcentaje : 0;
  const montoDescuento = subtotalCarrito * (porcentajeDescuento / 100);
  const totalCarrito = subtotalCarrito - montoDescuento;
  const totalItems = carrito.reduce((suma, item) => suma + item.cantidad, 0);

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Math.round(precio));
  };

  const enviarPedidoWhatsApp = async (e: any) => {
    e.preventDefault();
    if (carrito.length === 0 || !configNegocio.tienda_abierta) return;

    const telefonoLocal = configNegocio.whatsapp_numero.replace(/\D/g, '');

    const datosPedido = {
      cliente_nombre: nombre,
      direccion: direccion,
      telefono: telefonoCliente,
      metodo_pago: metodoPago,
      total: totalCarrito,
      notas: notas,
      items: carrito
    };

    try {
      await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPedido)
      });
    } catch (err) {
      console.error("Error al guardar pedido en base de datos:", err);
    }

    let mensaje = `*NUEVO PEDIDO - ${configNegocio.nombre_negocio.toUpperCase()}*\n\n` +
                  `*Cliente:* ${nombre.trim()}\n` +
                  `*Dirección/Mesa:* ${direccion.trim()}\n` +
                  `*Teléfono:* ${telefonoCliente ? telefonoCliente.trim() : 'No especificado'}\n` +
                  `*Método de Pago:* ${metodoPago}\n\n` +
                  `*RESUMEN DE ORDEN:*\n`;
      
    carrito.forEach((item) => { 
      mensaje += `- ${item.cantidad}x ${item.nombre} (${formatearPrecio(item.precio * item.cantidad)})\n`; 
    });

    if (configNegocio.descuento_web_activo && configNegocio.descuento_web_porcentaje > 0) {
      mensaje += `\n*Subtotal:* ${formatearPrecio(subtotalCarrito)}`;
      mensaje += `\n*Descuento Web (${configNegocio.descuento_web_porcentaje}%):* -${formatearPrecio(montoDescuento)}`;
    }

    mensaje += `\n*Total a pagar: ${formatearPrecio(totalCarrito)}*`;

    if (notas && notas.trim() !== "") {
      mensaje += `\n\n*Notas:* ${notas.trim()}`;
    }

    window.open(`https://wa.me/${telefonoLocal}?text=${encodeURIComponent(mensaje)}`, '_blank');
      
    setCarrito([]);
    setMostrarCarrito(false);
    setPasoCheckout(1);
    setNombre(''); setDireccion(''); setTelefonoCliente(''); setNotas('');
  };

  const categorias = ['Todas', ...Array.from(new Set(productos.map((p: any) => p.categoria).filter(Boolean)))];
  const normalizarTexto = (texto: string) => (texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const productosFiltrados = productos.filter((item: any) => {
    if (!item.disponible) return false;
    const cumpleCategoria = categoriaActiva === 'Todas' || item.categoria === categoriaActiva;
    const textoBusqueda = normalizarTexto(busqueda);
    const cumpleBusqueda = normalizarTexto(item.nombre).includes(textoBusqueda) || normalizarTexto(item.descripcion).includes(textoBusqueda);
    return cumpleCategoria && cumpleBusqueda;
  });

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col selection:bg-[#E50914] selection:text-white pb-32 overflow-x-hidden font-sans">
        
      {!configNegocio.tienda_abierta && (
        <div className="bg-red-600 text-white text-center py-3 px-4 font-black text-xs uppercase tracking-widest sticky top-0 z-[60] shadow-2xl flex items-center justify-center gap-2 animate-pulse">
          <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
          </span>
          <span>ATENCIÓN:</span> El local se encuentra cerrado temporalmente. No se están recibiendo pedidos en este momento.
        </div>
      )}

      {/* BANNER DE DESCUENTO WEB */}
      {configNegocio.tienda_abierta && configNegocio.descuento_web_activo && configNegocio.descuento_web_porcentaje > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-center py-2 px-4 font-black text-xs sm:text-sm uppercase tracking-widest sticky top-0 z-[60] shadow-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-4">
          <TicketIcon className="w-5 h-5 shrink-0" />
          <span>¡APROVECHA {configNegocio.descuento_web_porcentaje}% DE DESCUENTO AUTOMÁTICO PIDIENDO POR LA WEB!</span>
        </div>
      )}

      <header className={`w-full bg-[#181818]/90 backdrop-blur-xl border-b border-white/10 sticky z-50 transition-all shadow-xl ${configNegocio.descuento_web_activo || !configNegocio.tienda_abierta ? 'top-[40px]' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMenuLateralAbierto(true)}
              className="w-10 h-10 bg-[#222222] hover:bg-[#2A2A2A] rounded-xl flex items-center justify-center transition-all group active:scale-95 border border-white/10 shadow-md text-slate-300 hover:text-[#E50914] shrink-0"
              title="Abrir menú"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                <Bars3Icon className="w-5 h-5 shrink-0" />
              </span>
            </button>

            <div onClick={manejarClickLogo} className="flex items-center gap-3 cursor-pointer select-none group shrink-0">
              <div className="w-10 h-10 bg-black rounded-xl border border-white/20 flex items-center justify-center p-1 group-hover:border-[#E50914] group-hover:scale-110 shadow-lg transition-all duration-300 shrink-0">
                <img src="/logo.png" alt="Mr Kings Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-white text-base tracking-widest block leading-none group-hover:text-[#E50914] transition-colors">MR KINGS</span>
                <span className="text-[9px] text-[#E50914] font-bold uppercase tracking-widest">Sabor de Sofi</span>
              </div>
            </div>
          </div>

          <Link href="/" className="text-xs font-black text-slate-300 hover:text-white bg-[#222222] hover:bg-[#2A2A2A] px-5 py-2.5 rounded-xl transition-all border border-white/10 shadow-sm hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0">
            <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
              <ArrowLeftIcon className="w-4 h-4 shrink-0" />
            </span> 
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </header>

      {menuLateralAbierto && (
        <div className="fixed inset-0 z-[70] flex">
          <div onClick={() => setMenuLateralAbierto(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>
          <div className="relative w-80 max-w-[80vw] bg-[#181818] border-r border-white/10 h-full shadow-2xl z-50 p-6 flex flex-col justify-between animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl p-1 border border-white/20 shrink-0"><img src="/logo.png" className="w-full h-full object-contain" alt="Logo" /></div>
                  <h3 className="font-black uppercase tracking-wider text-sm">Menú Principal</h3>
                </div>
                <button onClick={() => setMenuLateralAbierto(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-black hover:bg-[#E50914] border border-white/10 transition-colors text-slate-300 hover:text-white shrink-0">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <XMarkIcon className="w-5 h-5 shrink-0" />
                  </span>
                </button>
              </div>
              <div className="space-y-3">
                <Link href="/" className="flex items-center gap-3 p-4 bg-black/40 rounded-xl hover:bg-[#E50914] transition-all font-bold text-sm border border-white/5 shadow-sm group">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-[#E50914] group-hover:text-white transition-colors">
                    <BuildingStorefrontIcon className="w-5 h-5 shrink-0" />
                  </span>
                  <span>Inicio de la Tienda</span>
                </Link>
                <Link href="/nosotros" className="flex items-center gap-3 p-4 bg-black/40 rounded-xl hover:bg-[#E50914] transition-all font-bold text-sm border border-white/5 shadow-sm group">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 text-[#E50914] group-hover:text-white transition-colors">
                    <BookOpenIcon className="w-5 h-5 shrink-0" />
                  </span>
                  <span>Nuestra Historia</span>
                </Link>
                <Link href="/admin" className="flex items-center gap-3 p-4 bg-red-950/40 text-red-400 rounded-xl hover:bg-[#E50914] hover:text-white transition-all font-bold text-sm border border-red-500/30 shadow-sm group">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0 transition-colors">
                    <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                  </span>
                  <span>Panel de Administración</span>
                </Link>
              </div>
            </div>
            <div className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t border-white/10 pt-4">
              Bogotá, Colombia
            </div>
          </div>
        </div>
      )}

      {categoriaActiva === 'Todas' && busqueda === '' && !cargando && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 pb-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-full bg-gradient-to-r from-[#b80710] to-[#590000] rounded-[2rem] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group border border-red-500/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
             
            <div className="relative z-10 text-center md:text-left mb-8 md:mb-0 max-w-lg">
              <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 mb-4 inline-flex items-center gap-1.5 shadow-inner animate-pulse">
                <SparklesIcon className="w-3.5 h-3.5" /> Sabor Inigualable
              </span>
              <h2 className="text-4xl sm:text-6xl font-black italic leading-none mb-4 tracking-tight">EXPERIENCIA <br className="hidden sm:block"/>ARTESANAL</h2>
              <p className="text-white/80 text-sm sm:text-base font-medium">Ingredientes frescos y preparación al instante. Pide ahora y recíbelo directamente en tu mesa.</p>
            </div>
             
            <div className="relative z-10 w-48 h-48 sm:w-64 sm:h-64 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700">
              <img src="/logo.png" alt="Promo" className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </section>
      )}

      <section className="sticky z-30 bg-[#121212]/95 backdrop-blur-xl py-5 px-4 sm:px-6 border-b border-white/5 shadow-2xl" style={{ top: configNegocio.descuento_web_activo || !configNegocio.tienda_abierta ? '113px' : '73px' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#E50914] transition-colors">
              <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                <MagnifyingGlassIcon className="w-5 h-5 shrink-0" />
              </span>
            </div>
            <input 
              type="text"
              placeholder="¿Qué deseas comer hoy?"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#1C1C1C] text-white placeholder-slate-500 rounded-2xl outline-none focus:ring-2 focus:ring-[#E50914] border border-white/10 text-sm shadow-lg transition-all"
            />
          </div>
            
          <div className="flex-1 overflow-x-auto pb-1 hide-scrollbar w-full">
            <div className="flex gap-2.5 min-w-max px-1">
              {categorias.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs transition-all duration-300 shadow-md active:scale-95 flex-shrink-0 ${
                    categoriaActiva === cat
                      ? 'bg-[#E50914] text-white border-2 border-red-500 shadow-red-950/50 scale-105'
                      : 'bg-[#1C1C1C] text-slate-300 border border-white/10 hover:bg-[#252525] hover:text-white hover:-translate-y-0.5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {cargando ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-[#181818] rounded-[24px] p-4 border border-white/5 animate-pulse flex flex-col h-[320px]">
                <div className="w-full aspect-square bg-[#111] rounded-2xl mb-4"></div>
                <div className="w-3/4 h-5 bg-[#111] rounded-full mb-2"></div>
                <div className="w-1/2 h-6 bg-[#111] rounded-full mt-auto mb-3"></div>
                <div className="w-full h-11 bg-[#111] rounded-xl mt-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {productosFiltrados.map((item: any) => (
              <div 
                key={item.id} 
                className="bg-[#181818] hover:bg-[#1F1F1F] border border-white/10 hover:border-[#E50914]/50 rounded-[24px] sm:rounded-[32px] p-3 sm:p-5 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#E50914]/20 hover:-translate-y-2 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-8 overflow-hidden"
              >
                <div className="w-full aspect-square bg-[#111111] rounded-2xl flex items-center justify-center relative overflow-hidden mb-4 shadow-inner border border-white/5 group-hover:border-[#E50914]/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#E50914]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
                   
                  {item.imagen ? (
                    <img src={item.imagen} alt={item.nombre} className="w-4/5 h-4/5 object-contain relative z-0 group-hover:scale-110 transition-transform duration-700 drop-shadow-2xl" />
                  ) : (
                    <img src="/logo.png" className="w-1/2 h-1/2 object-contain opacity-20 relative z-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" alt="Default logo" />
                  )}
                   
                  <div className="absolute top-2 left-2 z-20">
                    <span className="bg-black/80 backdrop-blur-md text-[#E50914] text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md border border-white/10 shadow-md">
                      {item.categoria}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 px-1">
                  <h3 className="font-bold text-sm sm:text-lg leading-tight mb-1 line-clamp-2 text-white group-hover:text-[#E50914] transition-colors">{item.nombre}</h3>
                  <div className="mt-auto mb-4">
                    {configNegocio.descuento_web_activo && configNegocio.descuento_web_porcentaje > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 line-through font-bold">{formatearPrecio(item.precio)}</span>
                        <span className="font-black text-amber-500 text-base sm:text-xl tracking-tight">
                          {formatearPrecio(item.precio - (item.precio * (configNegocio.descuento_web_porcentaje / 100)))}
                        </span>
                      </div>
                    ) : (
                      <p className="font-black text-white text-base sm:text-xl tracking-tight">{formatearPrecio(item.precio)}</p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => agregarAlCarrito(item)}
                  disabled={!configNegocio.tienda_abierta}
                  className={`w-full font-black py-3 rounded-xl border transition-all duration-300 text-xs sm:text-sm flex items-center justify-center gap-2 relative overflow-hidden ${
                    configNegocio.tienda_abierta 
                      ? 'bg-[#111111] hover:bg-[#E50914] text-white border-white/10 hover:border-red-500/50 active:scale-95' 
                      : 'bg-slate-900 text-slate-500 border-white/5 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                    <PlusIcon className="w-4 h-4 shrink-0" />
                  </span> 
                  <span className="relative z-10">{configNegocio.tienda_abierta ? 'Agregar' : 'Local Cerrado'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {!cargando && productosFiltrados.length === 0 && (
          <div className="text-center py-24 bg-[#1A1A1A] rounded-[2rem] border border-white/10 mt-4 shadow-inner">
            <span className="w-12 h-12 inline-flex items-center justify-center text-slate-500 mx-auto mb-4 opacity-50 shrink-0">
              <MagnifyingGlassIcon className="w-12 h-12 shrink-0" />
            </span>
            <p className="text-slate-400 font-bold text-lg">No encontramos resultados para tu búsqueda.</p>
          </div>
        )}
      </section>

      {montado && totalItems > 0 && configNegocio.tienda_abierta && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button 
            onClick={() => { setPasoCheckout(1); setMostrarCarrito(true); }}
            className="w-full max-w-md bg-[#E50914] hover:bg-[#b80710] text-white font-black py-4 px-6 rounded-2xl shadow-[0_15px_40px_rgba(229,9,20,0.6)] flex items-center justify-between active:scale-95 hover:scale-105 transition-all border border-red-400/30"
          >
            <div className="bg-black/20 backdrop-blur-md px-3.5 py-1 rounded-xl text-sm font-black border border-white/10 shadow-inner flex items-center gap-1.5">
              <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                <ShoppingBagIcon className="w-4 h-4 shrink-0" />
              </span>
              <span>{totalItems}</span>
            </div>
            <span className="text-sm sm:text-base uppercase tracking-widest font-black">Revisar Orden</span>
            <span className="text-base sm:text-lg">{formatearPrecio(totalCarrito)}</span>
          </button>
        </div>
      )}

      {/* MODAL DE CHECKOUT POR ETAPAS */}
      {mostrarCarrito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
          <div onClick={() => setMostrarCarrito(false)} className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"></div>
           
          <div className="relative w-full max-w-lg bg-[#141414] rounded-[2.5rem] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in zoom-in-95 duration-300">
             
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-950/70 border border-red-500/30 flex items-center justify-center text-[#E50914]">
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    {pasoCheckout === 1 ? <ShoppingBagIcon className="w-5 h-5 shrink-0" /> : <CreditCardIcon className="w-5 h-5 shrink-0" />}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-black italic tracking-wide text-white">
                    {pasoCheckout === 1 ? 'TICKET DE ORDEN' : 'MÉTODO DE PAGO Y DATOS'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Paso {pasoCheckout} de 2 — Mr Kings Arepa
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMostrarCarrito(false)} 
                  className="w-9 h-9 bg-black/60 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center shrink-0"
                >
                  <span className="w-5 h-5 inline-flex items-center justify-center shrink-0">
                    <XMarkIcon className="w-5 h-5 shrink-0" />
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 hide-scrollbar">
               
              {pasoCheckout === 1 ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Tus productos seleccionados</h3>
                    <button 
                      onClick={vaciarCarrito} 
                      className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 tracking-wider bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-1.5 transition-colors"
                    >
                      <span className="w-3.5 h-3.5 inline-flex items-center justify-center shrink-0">
                        <TrashIcon className="w-3.5 h-3.5 shrink-0" />
                      </span>
                      Vaciar Carrito
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {carrito.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 bg-[#1C1C1C] px-4 py-3 rounded-2xl border border-white/5 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">{item.nombre}</h4>
                          <p className="text-xs font-black text-[#E50914] mt-0.5">{formatearPrecio(item.precio * item.cantidad)}</p>
                        </div>
                           
                        <div className="flex items-center bg-black rounded-xl p-1 border border-white/10">
                          <button onClick={() => cambiarCantidad(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0">
                            <MinusIcon className="w-4 h-4 shrink-0" />
                          </button>
                          <span className="font-black text-xs w-6 text-center text-white">{item.cantidad}</span>
                          <button onClick={() => cambiarCantidad(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0">
                            <PlusIcon className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-white/10 space-y-3 mt-6">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                      <span>Subtotal:</span>
                      <span>{formatearPrecio(subtotalCarrito)}</span>
                    </div>

                    {configNegocio.descuento_web_activo && configNegocio.descuento_web_porcentaje > 0 && (
                      <div className="flex justify-between items-center text-sm font-bold text-amber-500">
                        <span>Descuento Web ({configNegocio.descuento_web_porcentaje}%):</span>
                        <span>- {formatearPrecio(montoDescuento)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-lg font-black text-white pt-2 border-t border-white/10">
                      <span className="uppercase tracking-widest text-xs text-slate-400">Total a Pagar:</span>
                      <span className="text-[#E50914] text-2xl">{formatearPrecio(totalCarrito)}</span>
                    </div>

                    <button 
                      onClick={() => setPasoCheckout(2)}
                      className="w-full bg-[#E50914] hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-950/60 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/30 mt-4"
                    >
                      Continuar con el Pago y Envío
                      <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 ml-1">
                        <ArrowLeftIcon className="w-4 h-4 shrink-0 rotate-180" />
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={enviarPedidoWhatsApp} className="space-y-4 animate-in fade-in duration-300">
                   
                  <div>
                    <label className="block text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2">Selecciona Método de Pago</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'Efectivo', label: 'Efectivo', icon: BanknotesIcon },
                        { id: 'Nequi', label: 'Nequi', icon: DevicePhoneMobileIcon },
                        { id: 'Bancolombia', label: 'Bancolombia', icon: BuildingStorefrontIcon },
                        { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCardIcon }
                      ].map((metodo) => {
                        const IconComponent = metodo.icon;
                        return (
                          <button
                            type="button"
                            key={metodo.id}
                            onClick={() => setMetodoPago(metodo.id)}
                            className={`py-3 px-2 rounded-2xl text-xs font-black transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-1.5 ${
                              metodoPago === metodo.id 
                                ? 'bg-[#E50914] text-white border-red-500 shadow-red-950/60 scale-105' 
                                : 'bg-black text-slate-300 border-white/10 hover:bg-[#252525]'
                            }`}
                          >
                            <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                              <IconComponent className="w-4 h-4 shrink-0" />
                            </span>
                            <span>{metodo.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {metodoPago !== 'Efectivo' && (
                    <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs text-slate-200 flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-black text-white">
                        <span className="w-4 h-4 inline-flex items-center justify-center shrink-0 text-[#E50914]">
                          <DevicePhoneMobileIcon className="w-4 h-4 shrink-0" />
                        </span>
                        <span>Instrucción para Pago con {metodoPago}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {metodoPago === 'Tarjeta' 
                          ? 'Se solicitará el datáfono al momento de la entrega o en la caja del local.'
                          : `Realiza tu transferencia a la cuenta de ${metodoPago}. Al enviar el pedido por WhatsApp, adjunta el comprobante.`}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 shrink-0" />
                          </span>
                          <span>Nombre Completo *</span>
                        </label>
                        <input type="text" placeholder="Ej. Carlos Pérez" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-3.5 bg-black text-white placeholder-slate-600 rounded-xl outline-none border border-white/10 focus:border-[#E50914] text-sm shadow-inner transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                            <MapPinIcon className="w-4 h-4 shrink-0" />
                          </span>
                          <span>Dirección / Mesa *</span>
                        </label>
                        <input type="text" placeholder="Ej. Calle 20 # 4-15" required value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full p-3.5 bg-black text-white placeholder-slate-600 rounded-xl outline-none border border-white/10 focus:border-[#E50914] text-sm shadow-inner transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                          <PhoneIcon className="w-4 h-4 shrink-0" />
                        </span>
                        <span>Teléfono de Contacto</span>
                      </label>
                      <input type="tel" placeholder="Ej. 300 123 4567" value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} className="w-full p-3.5 bg-black text-white placeholder-slate-600 rounded-xl outline-none border border-white/10 focus:border-[#E50914] text-sm shadow-inner transition-all" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                          <DocumentTextIcon className="w-4 h-4 shrink-0" />
                        </span>
                        <span>Notas especiales (Opcional)</span>
                      </label>
                      <textarea placeholder="Ej. Arepa bien asada, sin salsa de ajo..." value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full p-3.5 bg-black text-white placeholder-slate-600 rounded-xl outline-none border border-white/10 focus:border-[#E50914] text-sm shadow-inner transition-all resize-none" rows={3} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setPasoCheckout(1)}
                      className="w-1/3 bg-black hover:bg-white/10 text-slate-300 font-black py-4 rounded-2xl border border-white/10 text-xs uppercase transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
                        <ArrowLeftIcon className="w-4 h-4 shrink-0" />
                      </span>
                      <span>Volver</span>
                    </button>

                    <button 
                      type="submit" 
                      disabled={!configNegocio.tienda_abierta} 
                      className="w-2/3 bg-[#E50914] hover:bg-red-700 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-950/60 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-red-500/30"
                    >
                      Confirmar Orden 
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}
    </main>
  );
}