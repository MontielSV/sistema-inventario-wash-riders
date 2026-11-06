'use client';
import { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import * as XLSX from 'xlsx';
import { 
  PlusIcon, DocumentChartBarIcon, MagnifyingGlassIcon, PencilSquareIcon, 
  TrashIcon, PhotoIcon, ClipboardDocumentListIcon, XMarkIcon, 
  CubeIcon, LinkIcon, ArrowDownTrayIcon, PlayIcon, PauseIcon 
} from '@heroicons/react/24/outline';

export default function ProductosView() {
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  
  // ESTADOS PARA EL FORMULARIO (Crear / Editar)
  const [productoAEditar, setProductoAEditar] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Arepas');
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // ESTADOS PARA RECETAS BOM
  const [modalReceta, setModalReceta] = useState(false);
  const [productoActual, setProductoActual] = useState<any>(null);
  const [insumosBD, setInsumosBD] = useState<any[]>([]);
  const [recetaConfig, setRecetaConfig] = useState<any[]>([]); 
  const [nuevoInsumoId, setNuevoInsumoId] = useState('');
  const [nuevaCantidadGasto, setNuevaCantidadGasto] = useState('');

  // ESTADOS PARA EXCEL DE RECETAS
  const [modalExcel, setModalExcel] = useState(false);
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarProductos();
    cargarInsumos(); 
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await fetch('/api/productos', { cache: 'no-store' }); 
      if (res.ok) setProductos(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const cargarInsumos = async () => {
    try {
      const res = await fetch('/api/inventario');
      if (res.ok) setInsumosBD(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const abrirModalCrear = () => {
    setProductoAEditar(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoria('Arepas');
    setPreviewUrl('');
    setArchivoImagen(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (prod: any) => {
    setProductoAEditar(prod.id);
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion || '');
    setPrecio(String(prod.precio));
    setCategoria(prod.categoria || 'Arepas');
    setPreviewUrl(prod.imagen && prod.imagen !== '/logo.png' ? prod.imagen : '');
    setArchivoImagen(null);
    setModalAbierto(true);
  };

  const handleSeleccionarImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imageFile = e.target.files[0];
      const options = { maxSizeMB: 0.15, maxWidthOrHeight: 800, useWebWorker: true };
      try {
        setMensaje("Optimizando imagen...");
        const compressedFile = await imageCompression(imageFile, options);
        setArchivoImagen(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
        setMensaje(""); 
      } catch (error) {
        setMensaje("Error al procesar la imagen.");
      }
    }
  };

  const guardarProducto = async (e: any) => {
    e.preventDefault();
    if (!nombre || !precio) return;
    setSubiendoImagen(true);
    setMensaje(archivoImagen ? "Subiendo imagen y guardando..." : "Guardando cambios...");

    try {
      let urlImagenFinal = productoAEditar 
        ? (productos.find(p => p.id === productoAEditar)?.imagen || '/logo.png') 
        : '/logo.png'; 

      if (archivoImagen) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        const formData = new FormData();
        formData.append('file', archivoImagen);
        formData.append('upload_preset', uploadPreset || '');
        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) urlImagenFinal = cloudData.secure_url;
      }

      const payload = { 
        nombre, 
        descripcion, 
        precio: parseFloat(precio), 
        categoria, 
        imagen: urlImagenFinal 
      };

      const url = '/api/productos';
      const method = productoAEditar ? 'PUT' : 'POST';
      const body = productoAEditar 
        ? JSON.stringify({ id: productoAEditar, ...payload }) 
        : JSON.stringify({ ...payload, disponible: true });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (res.ok) {
        setMensaje(productoAEditar ? "¡Plato actualizado con éxito!" : "¡Plato añadido exitosamente!");
        cargarProductos();
        setModalAbierto(false);
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (error) {
      setMensaje("Error al guardar el producto.");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const eliminarProducto = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este producto definitivamente del menú?")) {
      await fetch(`/api/productos?id=${id}`, { method: 'DELETE' });
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  const toggleDisponibilidad = async (id: number, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    setProductos(productos.map(p => p.id === id ? { ...p, disponible: nuevoEstado } : p));
    try {
      await fetch('/api/productos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, disponible: nuevoEstado }) });
    } catch (error) {
      cargarProductos();
    }
  };

  // EXCEL PARA RECETAS
  const descargarPlantillaRecetas = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { Plato: "Arepa Burger", Insumo: "Porción Carne Desmechada (150g)", Cantidad: 1 },
      { Plato: "Arepa Burger", Insumo: "Icopor Arepa Pequeño", Cantidad: 1 },
      { Plato: "Hamburguesa Sencilla", Insumo: "Pan Hamburguesa", Cantidad: 1 },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Recetas");
    XLSX.writeFile(wb, "Plantilla_Recetas_MrKings.xlsx");
  };

  const handleCargaExcelRecetas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcesandoExcel(true);
    setMensaje("Conectando ingredientes con platos...");
    try {
      const reader = new FileReader();
      reader.onload = async (evento) => {
        const data = new Uint8Array(evento.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setMensaje("El archivo Excel está vacío.");
          setProcesandoExcel(false); return;
        }

        const res = await fetch('/api/recetas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jsonData)
        });

        if (res.ok) {
          setMensaje("¡Matriz de Recetas (BOM) sincronizada con éxito!");
          setModalExcel(false);
        } else {
          setMensaje("Error al procesar el Excel. Revisa los nombres.");
        }
        setTimeout(() => setMensaje(''), 4000);
        setProcesandoExcel(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setMensaje("Error leyendo el archivo.");
      setProcesandoExcel(false);
    }
  };

  // RECETA INDIVIDUAL
  const abrirModalReceta = async (producto: any) => {
    setProductoActual(producto);
    setRecetaConfig([]);
    setModalReceta(true);
    try {
      const res = await fetch(`/api/recetas?producto_id=${producto.id}`);
      if (res.ok) {
        const data = await res.json();
        setRecetaConfig(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const agregarInsumoAReceta = () => {
    if (!nuevoInsumoId || !nuevaCantidadGasto) return;
    const insumoReal = insumosBD.find(i => String(i.id) === String(nuevoInsumoId));
    if (!insumoReal) return;
    if (recetaConfig.some(r => String(r.insumo_id) === String(nuevoInsumoId))) {
      alert("Este insumo ya está en la receta."); return;
    }
    setRecetaConfig([...recetaConfig, {
      insumo_id: insumoReal.id, nombre_insumo: insumoReal.nombre, unidad_medida: insumoReal.unidad_medida, cantidad_usada: parseFloat(nuevaCantidadGasto)
    }]);
    setNuevoInsumoId(''); setNuevaCantidadGasto('');
  };

  const quitarInsumoReceta = (insumo_id: number) => setRecetaConfig(recetaConfig.filter(r => r.insumo_id !== insumo_id));

  const guardarRecetaEnBD = async () => {
    setMensaje("Guardando receta técnica...");
    try {
      const res = await fetch('/api/recetas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: productoActual.id, ingredientes: recetaConfig.map(r => ({ insumo_id: r.insumo_id, cantidad_usada: r.cantidad_usada })) })
      });
      if (res.ok) {
        setMensaje("¡Receta guardada exitosamente!");
        setTimeout(() => { setMensaje(''); setModalReceta(false); }, 3000);
      }
    } catch (e) {
      setMensaje("Error al guardar receta.");
    }
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
    return coincideBusqueda && coincideCategoria;
  });

  const categoriasExactas = ["Empanadas", "Arepas", "Chorizos", "Hamburguesas", "Combos", "Perros", "Pinchos", "Patacón", "Salchipapas", "Mazorcada", "Especiales", "Bebidas", "Otros"];

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black italic flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-7 h-7 text-[#E50914]" /> Catálogo de Platos
          </h2>
          <p className="text-slate-400 text-xs mt-1">Gestión del menú público y explosión de materiales (BOM).</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setModalExcel(true)} className="flex-1 sm:flex-none bg-blue-950/40 hover:bg-blue-900 border border-blue-500/30 text-blue-400 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2">
            <DocumentChartBarIcon className="w-4 h-4" /> Subir Recetas
          </button>
          <button onClick={abrirModalCrear} className="flex-1 sm:flex-none bg-[#E50914] hover:bg-[#b80710] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2">
            <PlusIcon className="w-4 h-4" /> Añadir Plato
          </button>
        </div>
      </div>

      {mensaje && <div className="mb-6 p-3 bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-black rounded-xl text-center shadow-lg">{mensaje}</div>}

      <div className="bg-[#181818] p-4 rounded-2xl border border-white/10 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-lg">
        <div className="relative flex items-center w-full md:w-96">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Buscar plato..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-[#E50914] transition-colors"/>
        </div>
        <div className="w-full md:w-auto flex-1">
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full md:w-auto bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#E50914]">
            <option value="Todas">Todas las Categorías</option>
            {categoriasExactas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-[#E50914] border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => (
            <div key={prod.id} className={`bg-[#181818] rounded-3xl border border-white/10 overflow-hidden shadow-xl hover:border-white/20 transition-all group flex flex-col relative ${!prod.disponible ? 'opacity-60 grayscale-[50%]' : ''}`}>
              <div className="h-32 bg-black relative overflow-hidden flex items-center justify-center p-6">
                <img src={prod.imagen || "/logo.png"} alt={prod.nombre} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500 opacity-90" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={() => abrirModalEditar(prod)} className="p-1.5 bg-black/60 hover:bg-black backdrop-blur-md rounded-lg text-white border border-white/10 transition-colors shadow-lg" title="Editar Producto">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-black text-sm text-white leading-tight">{prod.nombre}</h3>
                  <span className="text-[#E50914] font-black text-sm whitespace-nowrap">${Number(prod.precio).toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 line-clamp-2 leading-relaxed">{prod.descripcion || 'Sin descripción.'}</p>
                
                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase bg-black px-2 py-1 rounded border border-white/5 truncate max-w-[80px]">
                    {prod.categoria || 'General'}
                  </span>
                  
                  <div className="flex gap-2 w-full mt-2 justify-end">
                    <button onClick={() => abrirModalReceta(prod)} className="bg-blue-950/40 hover:bg-blue-900 text-blue-400 border border-blue-500/20 rounded px-2.5 py-1.5 transition-colors text-[10px] font-bold flex items-center gap-1 flex-1 justify-center">
                      <CubeIcon className="w-3.5 h-3.5" /> Config. Receta
                    </button>
                    <button onClick={() => toggleDisponibilidad(prod.id, prod.disponible)} className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 justify-center text-[10px] font-bold border ${prod.disponible ? 'bg-orange-950/40 hover:bg-orange-900 text-orange-400 border-orange-500/20' : 'bg-green-950/40 hover:bg-green-900 text-green-400 border-green-500/20'}`}>
                      {prod.disponible ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    </button>
                    <button onClick={() => eliminarProducto(prod.id)} className="bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-500/20 rounded px-2.5 py-1.5 transition-colors text-[10px] font-bold flex items-center justify-center">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalReceta && productoActual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setModalReceta(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-[#181818] border border-white/10 rounded-3xl w-full max-w-3xl z-50 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#111] p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-lg p-1.5 border border-white/10 flex items-center justify-center">
                  <img src={productoActual.imagen || "/logo.png"} alt={productoActual.nombre} className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/30">Bill of Materials (BOM)</span>
                  <h3 className="text-xl font-black italic text-white mt-1">{productoActual.nombre}</h3>
                </div>
              </div>
              <button onClick={() => setModalReceta(false)} className="text-slate-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-black/50 border border-white/10 p-5 rounded-2xl mb-6 shadow-inner">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2"><PlusIcon className="w-4 h-4" /> Añadir Insumo a la Receta</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select value={nuevoInsumoId} onChange={(e) => setNuevoInsumoId(e.target.value)} className="flex-[2] p-3 bg-black rounded-xl border border-white/20 text-white text-xs font-bold outline-none focus:border-blue-500 transition-colors shadow-lg">
                    <option value="">-- Buscar en Bodega --</option>
                    {insumosBD.filter(i => i.activo).map(ins => (
                      <option key={ins.id} value={ins.id}>{ins.nombre} ({ins.unidad_medida})</option>
                    ))}
                  </select>
                  <input type="number" step="0.01" min="0" placeholder="Ej: 1.5" value={nuevaCantidadGasto} onChange={(e) => setNuevaCantidadGasto(e.target.value)} className="flex-1 p-3 bg-black rounded-xl border border-white/20 text-white text-xs font-bold outline-none focus:border-blue-500 text-center" />
                  <button onClick={agregarInsumoAReceta} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95">Añadir</button>
                </div>
              </div>

              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Ingredientes Configurados ({recetaConfig.length})</h4>
              {recetaConfig.length === 0 ? (
                <div className="text-center py-10 bg-black/20 border border-white/5 rounded-2xl border-dashed">
                  <CubeIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 font-bold text-xs">Receta en blanco</p>
                </div>
              ) : (
                <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/60 text-slate-400 uppercase font-black tracking-wider border-b border-white/5">
                      <tr>
                        <th className="p-3">Insumo en Bodega</th>
                        <th className="p-3 text-center">Gasto por Plato</th>
                        <th className="p-3 text-right">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recetaConfig.map((item, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-bold text-white flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{item.nombre_insumo}</td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-950/40 text-blue-400 font-black px-3 py-1 rounded-lg border border-blue-500/20">
                              {item.cantidad_usada} <span className="text-[9px] uppercase">{item.unidad_medida}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => quitarInsumoReceta(item.insumo_id)} className="w-7 h-7 bg-red-950/40 hover:bg-red-900 text-red-500 rounded-lg flex items-center justify-center ml-auto"><XMarkIcon className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-[#111] p-5 border-t border-white/10 flex gap-3">
              <button onClick={() => setModalReceta(false)} className="flex-1 bg-black py-3.5 rounded-xl border border-white/10 font-bold text-xs uppercase tracking-wider hover:bg-white/5">Cancelar</button>
              <button onClick={guardarRecetaEnBD} className="flex-[2] bg-[#E50914] hover:bg-red-700 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(229,9,20,0.4)] text-white">Guardar Receta</button>
            </div>
          </div>
        </div>
      )}

      {modalExcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => !procesandoExcel && setModalExcel(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-[#181818] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md z-50 shadow-2xl text-center">
            <h3 className="text-xl font-black italic text-blue-500 mb-1">Sincronizar Recetas</h3>
            <p className="text-xs text-slate-400 mb-6">Sube el Excel para conectar automáticamente ingredientes a platos.</p>
            
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 mb-6 bg-black relative hover:border-blue-500/50 transition-colors">
              {procesandoExcel ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                  <span className="text-xs font-bold text-white">Procesando...</span>
                </div>
              ) : (
                <>
                  <LinkIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white mb-1">Selecciona el Excel</p>
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleCargaExcelRecetas} ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </>
              )}
            </div>

            <button onClick={descargarPlantillaRecetas} className="text-xs bg-blue-950/40 border border-blue-500/30 text-blue-400 font-bold px-4 py-3 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" /> Descargar Plantilla
            </button>
            <button onClick={() => setModalExcel(false)} disabled={procesandoExcel} className="mt-4 text-xs font-bold text-slate-400 hover:text-white">Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL CORREGIDO Y DEFINITIVO PARA CREAR/EDITAR PLATO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => !subiendoImagen && setModalAbierto(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-[#181818] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg z-50 text-white shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            
            <h3 className="text-xl font-black italic text-[#E50914] mb-1 flex items-center gap-2">
              {productoAEditar ? (
                <><PencilSquareIcon className="w-5 h-5" /> Editar Plato</>
              ) : (
                <><PlusIcon className="w-5 h-5" /> Añadir Nuevo Plato</>
              )}
            </h3>
            
            <p className="text-xs text-slate-400 mb-6">Gestiona la información pública de tu menú.</p>
            
            {/* Formulario estructurado con flex-col */}
            <form onSubmit={guardarProducto} className="flex flex-col gap-5 text-xs">
              
              {/* Contenedor de la imagen usando <label> nativo */}
              <div className="w-full">
                <label className="block font-bold text-slate-400 uppercase mb-2">Fotografía del Plato</label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-2xl bg-black hover:border-[#E50914] hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleSeleccionarImagen} 
                    className="hidden" 
                  />
                  {previewUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={previewUrl} alt="Vista previa" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PhotoIcon className="w-6 h-6 text-white mb-1" />
                        <span className="text-white text-[10px] font-bold">Cambiar foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <PhotoIcon className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="font-bold text-white text-xs">Subir imagen</span>
                      <span className="text-[10px] text-slate-500 mt-1">Haz clic aquí</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Nombre</label>
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">Precio (COP)</label>
                  <input type="number" required min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full p-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1">Categoría</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]">
                    {categoriasExactas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1">Descripción (Visual)</label>
                  <textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full p-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914] resize-none" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2 mt-2 border-t border-white/10">
                <button type="button" disabled={subiendoImagen} onClick={() => setModalAbierto(false)} className="flex-1 bg-black py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={subiendoImagen} className="flex-[2] bg-[#E50914] py-3 rounded-xl font-black uppercase shadow-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {subiendoImagen ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : (productoAEditar ? 'Guardar Cambios' : 'Añadir Plato')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}