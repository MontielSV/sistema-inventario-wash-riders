'use client';
import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  CubeIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  FolderIcon, 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  DocumentArrowUpIcon,
  PowerIcon
} from '@heroicons/react/24/outline';

export default function InventarioView() {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // Estados Modal Manual
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('Porción');
  const [stockMinimo, setStockMinimo] = useState('10');
  const [categoria, setCategoria] = useState('Porción Preparada');

  // Estados Modal Excel
  const [modalExcelAbierto, setModalExcelAbierto] = useState(false);
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const res = await fetch('/api/inventario');
      if (res.ok) {
        const data = await res.json();
        setInsumos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const ajustarStock = async (id: number, cantidadActual: number, ajuste: number) => {
    const nuevaCantidad = Number(cantidadActual) + ajuste;
    if (nuevaCantidad < 0) return; 

    setInsumos(insumos.map(i => i.id === id ? { ...i, cantidad: nuevaCantidad } : i));

    try {
      await fetch('/api/inventario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, cantidad: nuevaCantidad })
      });
    } catch (error) {
      cargarInventario(); 
    }
  };

  // 🔥 NUEVA FUNCIÓN: APAGAR O PRENDER PRODUCTO
  const toggleActivo = async (id: number, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    
    // Actualización visual instantánea
    setInsumos(insumos.map(i => i.id === id ? { ...i, activo: nuevoEstado } : i));

    try {
      await fetch('/api/inventario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'toggle', id, activo: nuevoEstado })
      });
    } catch (error) {
      console.error("Error cambiando estado", error);
      cargarInventario(); // Revertir si falla
    }
  };

  const guardarInsumoManual = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, cantidad: parseFloat(cantidad), unidad_medida: unidad, stock_minimo: parseFloat(stockMinimo), categoria })
      });
      if (res.ok) {
        setMensaje("Registrado correctamente.");
        cargarInventario();
        setModalAbierto(false);
        setNombre(''); setCantidad('');
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCargaExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcesandoExcel(true);
    setMensaje("Analizando inventario...");

    try {
      const reader = new FileReader();
      reader.onload = async (evento) => {
        const data = new Uint8Array(evento.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setMensaje("El archivo Excel está vacío.");
          setProcesandoExcel(false);
          return;
        }

        const res = await fetch('/api/inventario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData)
        });

        if (res.ok) {
          setMensaje("¡Stock sincronizado con éxito!");
          setModalExcelAbierto(false);
          cargarInventario();
        } else {
          setMensaje("Error al guardar. Verifica las columnas.");
        }
        setTimeout(() => setMensaje(''), 4000);
        setProcesandoExcel(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setMensaje("Error leyendo el archivo.");
      setProcesandoExcel(false);
    }
  };

  const insumosFiltrados = insumos.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const descargarPlantilla = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { Categoria: "Porción Preparada", Nombre: "Porción Carne Desmechada (150g)", Cantidad: 45, Unidad: "Porción", StockMinimo: 15 },
      { Categoria: "Empaques", Nombre: "Icopor Arepa Pequeño", Cantidad: 200, Unidad: "Unidad", StockMinimo: 50 },
      { Categoria: "Materia Prima", Nombre: "Bulto Maíz Blanco", Cantidad: 2, Unidad: "Bulto", StockMinimo: 1 },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "Inventario_MrKings.xlsx");
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-6xl mx-auto pb-16 px-4 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black italic flex items-center gap-2">
            <CubeIcon className="w-8 h-8 text-[#E50914] shrink-0" /> Inventario y Empaques
          </h2>
          <p className="text-slate-400 text-xs mt-1">Control de porciones preparadas, desechables y alertas de stock.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setModalAbierto(true)} className="flex-1 md:flex-none bg-black border border-white/20 hover:bg-white/5 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5">
            <PlusIcon className="w-4 h-4 text-[#E50914]" /> Añadir
          </button>
          <button onClick={() => setModalExcelAbierto(true)} className="flex-[2] md:flex-none bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl font-black text-xs uppercase shadow-[0_0_15px_rgba(22,163,74,0.4)] transition-all flex items-center justify-center gap-2">
            <DocumentArrowUpIcon className="w-4 h-4" /> Sincronizar Excel
          </button>
        </div>
      </div>

      {mensaje && <div className="mb-6 p-4 bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-black rounded-2xl text-center shadow-lg flex items-center justify-center gap-2">
        <CheckCircleIcon className="w-5 h-5 shrink-0" /> {mensaje}
      </div>}

      <div className="bg-[#181818] p-3 sm:p-4 rounded-2xl border border-white/10 mb-8 flex items-center gap-3 shadow-lg">
        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar porción, icopor, bebida..." 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
          className="w-full bg-transparent border-none text-xs text-white outline-none placeholder:text-slate-500"
        />
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-[#E50914] border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="bg-[#181818] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[10px] text-slate-400 bg-black/40 uppercase border-b border-white/10 tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-black">Categoría</th>
                  <th className="px-6 py-4 font-black">Artículo / Porción</th>
                  <th className="px-6 py-4 font-black text-center">Ajuste Rápido</th>
                  <th className="px-6 py-4 font-black text-center">Estado</th>
                  <th className="px-6 py-4 font-black text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {insumosFiltrados.map((item) => {
                  const estadoCritico = Number(item.cantidad) <= Number(item.stock_minimo);
                  const estaActivo = item.activo !== false; 

                  return (
                    <tr key={item.id} className={`hover:bg-white/5 transition-all group ${!estaActivo ? 'opacity-40 grayscale' : ''}`}>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{item.categoria}</td>
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${!estaActivo ? 'bg-slate-600' : estadoCritico ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                        {item.nombre}
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center bg-black border border-white/10 rounded-xl overflow-hidden ${!estaActivo ? 'pointer-events-none' : ''}`}>
                          <button onClick={() => ajustarStock(item.id, item.cantidad, -1)} className="px-3 py-2 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border-r border-white/10 font-black">-</button>
                          <div className={`px-4 font-black text-sm w-16 text-center ${estaActivo && estadoCritico ? 'text-red-500' : 'text-white'}`}>
                            {item.cantidad}
                          </div>
                          <button onClick={() => ajustarStock(item.id, item.cantidad, 1)} className="px-3 py-2 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border-l border-white/10 font-black">+</button>
                        </div>
                        <span className="block text-[9px] text-slate-500 mt-1 uppercase">{item.unidad_medida}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {!estaActivo ? (
                          <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Inactivo</span>
                        ) : estadoCritico ? (
                          <span className="bg-red-950/40 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Agotándose</span>
                        ) : (
                          <span className="bg-green-950/40 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Óptimo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleActivo(item.id, estaActivo)} 
                          className={`text-xs font-bold uppercase px-3.5 py-2 rounded-xl transition-colors border inline-flex items-center gap-1.5 ${estaActivo ? 'text-orange-400 border-orange-500/30 hover:bg-orange-950/40' : 'text-green-400 border-green-500/30 hover:bg-green-950/40'}`}
                        >
                          <PowerIcon className="w-3.5 h-3.5" /> {estaActivo ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {insumosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <FolderIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-sm">Inventario en blanco</p>
                      <p className="text-xs text-slate-500 mt-1">Sube la plantilla de Excel o añade manualmente tu primer insumo.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL MANUAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setModalAbierto(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-[#181818] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md z-50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic text-[#E50914] flex items-center gap-2">
                <PlusIcon className="w-6 h-6" /> Añadir al Inventario
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={guardarInsumoManual} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Categoría</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]">
                    <option>Porción Preparada</option>
                    <option>Empaques</option>
                    <option>Materia Prima</option>
                    <option>Bebidas</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Nombre (Ej: Icopor, Porción Carne)</label>
                  <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Cantidad Inicial</label>
                  <input type="number" step="0.01" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Unidad (Ej: Porción)</label>
                  <input type="text" required value={unidad} onChange={(e) => setUnidad(e.target.value)} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">Stock Mínimo (Alerta rojo)</label>
                  <input type="number" step="0.01" required value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white outline-none focus:border-[#E50914]" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 bg-black py-3.5 rounded-xl border border-white/10 font-bold hover:bg-white/5">Cancelar</button>
                <button type="submit" className="flex-[2] bg-[#E50914] py-3.5 rounded-xl font-black uppercase shadow-lg hover:bg-red-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCEL */}
      {modalExcelAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => !procesandoExcel && setModalExcelAbierto(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="relative bg-[#181818] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md z-50 shadow-2xl text-center">
            <h3 className="text-xl font-black italic text-green-500 mb-2">Sincronizar Excel 📊</h3>
            <p className="text-xs text-slate-400 mb-6">El archivo limpiará y actualizará todo el inventario automáticamente.</p>
            
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 mb-6 bg-black relative hover:border-green-500/50 transition-colors">
              {procesandoExcel ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mb-3"></div>
                  <span className="text-xs font-bold text-white">Analizando componentes...</span>
                </div>
              ) : (
                <>
                  <DocumentArrowUpIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-xs font-bold text-white mb-1">Selecciona el Excel del Negocio</p>
                  <p className="text-[10px] text-slate-500">.xlsx o .csv</p>
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleCargaExcel} ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </>
              )}
            </div>

            <button onClick={descargarPlantilla} className="text-xs bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/60 text-blue-400 font-bold px-4 py-3.5 rounded-xl w-full transition-colors flex items-center justify-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4" /> Descargar Formato Oficial
            </button>
            
            <button onClick={() => setModalExcelAbierto(false)} disabled={procesandoExcel} className="mt-4 text-xs font-bold text-slate-400 hover:text-white">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}