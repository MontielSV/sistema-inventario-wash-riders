'use client';
import { useState, useEffect } from 'react';
import ResumenFinanciero from './dashboard/ResumenFinanciero';
import GraficosVentas from './dashboard/GraficosVentas';
import CanalesYPagos from './dashboard/CanalesYPagos';
import MetaDiaria from './dashboard/MetaDiaria';
import MetricasOperacion from './dashboard/MetricasOperacion';

import { 
  ArrowDownTrayIcon, 
  ChartPieIcon, 
  ArrowTrendingUpIcon, 
  ChartBarIcon, 
  CalendarIcon, 
  BuildingOfficeIcon, 
  BuildingLibraryIcon, 
  TagIcon, 
  TrophyIcon, 
  ClockIcon,
  DocumentTextIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

type VistaActiva = 'resumen' | 'hoy' | 'semana' | 'mes' | 'semestre' | 'anual' | 'ticket' | 'metas' | 'operacion';

export default function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [errorSQL, setErrorSQL] = useState<string | null>(null);
  
  const [ventanaActiva, setVentanaActiva] = useState<VistaActiva>('resumen');
  
  const [metaVentas, setMetaVentas] = useState(1000000);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [inputMeta, setInputMeta] = useState('1000000');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard/resumen', { cache: 'no-store' });
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("El servidor no devolvió un JSON válido. Revisa la ruta de la API.");
        }

        const json = await res.json();
        
        if (json.error) {
          setErrorSQL(json.error);
        } else {
          setData(json);
          if (json.finanzas?.metaDiaria) {
            setMetaVentas(Number(json.finanzas.metaDiaria));
            setEditandoMeta((prev) => {
              if (!prev) setInputMeta(String(json.finanzas.metaDiaria));
              return prev;
            });
          }
          setErrorSQL(null);
        }
      } catch (err: any) {
        console.error("Error conectando a la API:", err);
        setErrorSQL(err.message || "No se pudo conectar con el servidor.");
      } finally {
        setCargando(false);
      }
    };

    fetchDashboard();
    const int = setInterval(fetchDashboard, 6000);
    return () => clearInterval(int);
  }, []);

  const exportarCSV = (nombreReporte: string, datosExportar: any) => {
    if (!datosExportar) return;
    const lineas = [
      "Métrica,Valor",
      ...Object.entries(datosExportar).map(([k, v]) => `${k},${v}`)
    ];
    const csvContent = "data:text/csv;charset=utf-8," + lineas.join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Reporte_${nombreReporte}_MrKings_${new Date().toLocaleDateString('es-CO')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const guardarMeta = async () => {
    const v = parseInt(inputMeta);
    if (!isNaN(v) && v > 0) { 
      setMetaVentas(v); 
      setEditandoMeta(false); 

      try {
        const response = await fetch('/api/dashboard/resumen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nuevaMeta: v })
        });
        
        const result = await response.json();
        if (result.error) {
          console.error("Error del servidor al guardar meta:", result.error);
        }
      } catch (error) {
        console.error("Error en la petición POST de meta:", error);
      }
    }
  };

  if (cargando && !data) return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#E50914] font-black text-xl animate-pulse">Sincronizando con PostgreSQL...</p>
    </div>
  );

  if (errorSQL) return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-8">
      <div className="bg-red-950/40 border border-[#E50914] p-8 rounded-3xl max-w-2xl text-center shadow-[0_0_30px_rgba(229,9,20,0.2)]">
        <h2 className="text-3xl font-black text-[#E50914] mb-4">⚠️ Error de Conexión API</h2>
        <p className="text-slate-300 mb-6 font-medium">{errorSQL}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans selection:bg-[#E50914] selection:text-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(229,9,20,0.15),rgba(0,0,0,0))]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50914] opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-[#E50914]"></span></span>
              <span className="text-[10px] text-[#E50914] font-black uppercase tracking-widest bg-red-950/40 px-3 py-1 rounded-md border border-red-500/30">Enterprise Operations Command</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter">
              Mr Kings <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-500">Analytics</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => exportarCSV('General', data.finanzas)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 active:scale-95">
              <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        </header>

        {/* NAVEGACIÓN EXTENDIDA (CON SEMESTRAL Y ANUAL) */}
        <nav className="flex flex-wrap gap-2 bg-[#111]/90 p-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <button onClick={() => setVentanaActiva('resumen')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'resumen' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <ChartPieIcon className="w-4 h-4" /> General
          </button>
          <button onClick={() => setVentanaActiva('hoy')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'hoy' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <ArrowTrendingUpIcon className="w-4 h-4" /> Hoy
          </button>
          <button onClick={() => setVentanaActiva('semana')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'semana' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <ChartBarIcon className="w-4 h-4" /> 7 Días
          </button>
          <button onClick={() => setVentanaActiva('mes')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'mes' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <CalendarIcon className="w-4 h-4" /> Mes
          </button>
          <button onClick={() => setVentanaActiva('semestre')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'semestre' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <BuildingOfficeIcon className="w-4 h-4" /> Semestral
          </button>
          <button onClick={() => setVentanaActiva('anual')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'anual' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <BuildingLibraryIcon className="w-4 h-4" /> Anual (DIAN)
          </button>
          <button onClick={() => setVentanaActiva('ticket')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'ticket' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <TagIcon className="w-4 h-4" /> Ticket
          </button>
          <button onClick={() => setVentanaActiva('metas')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'metas' ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <TrophyIcon className="w-4 h-4" /> Metas
          </button>
          <button onClick={() => setVentanaActiva('operacion')} className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${ventanaActiva === 'operacion' ? 'bg-zinc-800 text-white shadow-lg scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <ClockIcon className="w-4 h-4" /> Operación
          </button>
        </nav>

        <main className="transition-all duration-300">
          
          {ventanaActiva === 'resumen' && data && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ResumenFinanciero 
                data={data.finanzas} 
                onNavegar={(seccion) => {
                  if (seccion === 'hoy') setVentanaActiva('hoy');
                  else if (seccion === 'semana') setVentanaActiva('semana');
                  else if (seccion === 'mes') setVentanaActiva('mes');
                  else if (seccion === 'ticket') setVentanaActiva('ticket');
                }} 
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GraficosVentas datosPorHora={data.graficos.ventasPorHora} />
                <CanalesYPagos pagos={data.pagos} />
              </div>
            </div>
          )}

          {ventanaActiva === 'hoy' && data && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-[#E50914]" /> Apartado Especial: Ventas del Día (Hoy)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Desglose de la jornada actual en tiempo real</p>
                </div>
                <button onClick={() => exportarCSV('Hoy', { ventasHoy: data.finanzas.ventasHoy, transacciones: data.finanzas.transaccionesHoy })} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV de Hoy
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GraficosVentas datosPorHora={data.graficos.ventasPorHora} />
                <CanalesYPagos pagos={data.pagos} />
              </div>
            </div>
          )}

          {ventanaActiva === 'semana' && data && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-[#E50914]" /> Apartado Especial: Acumulado 7 Días
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Comportamiento financiero de la última semana</p>
                </div>
                <button onClick={() => exportarCSV('7Dias', { ventasSemana: data.finanzas.ventasSemana })} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV Semana
                </button>
              </div>
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center bg-black/50 p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-slate-300 font-bold text-sm">Total Acumulado de la Semana</span>
                  <span className="text-emerald-400 font-black text-3xl font-mono">${Number(data.finanzas.ventasSemana || 0).toLocaleString('es-CO')}</span>
                </div>
                <p className="text-xs text-slate-500 italic px-2">Datos consolidados directamente desde la base de datos PostgreSQL.</p>
              </div>
            </div>
          )}

          {ventanaActiva === 'mes' && data && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-[#E50914]" /> Apartado Especial: Histórico Mes Actual
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Consolidado corporativo del mes en curso</p>
                </div>
                <button onClick={() => exportarCSV('MesActual', { ventasMes: data.finanzas.ventasMes })} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV Mes
                </button>
              </div>
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center bg-black/50 p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-slate-300 font-bold text-sm">Ventas Totales del Mes</span>
                  <span className="text-emerald-400 font-black text-3xl font-mono">${Number(data.finanzas.ventasMes || 0).toLocaleString('es-CO')}</span>
                </div>
                <p className="text-xs text-slate-500 italic px-2">Proyección y cierre de caja sincronizados con el servidor.</p>
              </div>
            </div>
          )}

          {ventanaActiva === 'semestre' && data && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                    <BuildingOfficeIcon className="w-6 h-6 text-[#E50914]" /> Cierre Semestral
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Consolidado operativo de los últimos 6 meses</p>
                </div>
                <button onClick={() => exportarCSV('Cierre_Semestral', { ventasSemestral: data.finanzas.ventasSemestral })} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Exportar Balance Semestral
                </button>
              </div>
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center bg-black/50 p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-slate-300 font-bold text-sm">Ingresos Totales (Semestre)</span>
                  <span className="text-emerald-400 font-black text-3xl font-mono">${Number(data.finanzas.ventasSemestral || 0).toLocaleString('es-CO')}</span>
                </div>
                <p className="text-xs text-slate-500 italic px-2">Análisis de rendimiento a mediano plazo para reinversión operativa.</p>
              </div>
            </div>
          )}

          {ventanaActiva === 'anual' && data && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-[#E50914]/20 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white italic flex items-center gap-3">
                    <BuildingLibraryIcon className="w-7 h-7 text-white" /> Reporte Fiscal Anual (DIAN)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Consolidado definitivo del año en curso para obligaciones tributarias</p>
                </div>
                <button onClick={() => exportarCSV('Declaracion_DIAN', { ventasAnual: data.finanzas.ventasAnual })} className="bg-red-700 hover:bg-red-600 text-white font-black px-5 py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2 border border-red-500/50">
                  <DocumentTextIcon className="w-5 h-5" /> Generar CSV Contable
                </button>
              </div>
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center bg-black/50 p-8 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-slate-300 font-black text-base uppercase tracking-wider">Ingresos Brutos Anuales</span>
                  <span className="text-[#E50914] font-black text-4xl font-mono">${Number(data.finanzas.ventasAnual || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="bg-amber-950/30 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 mt-4">
                  <ScaleIcon className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Nota de Cumplimiento</p>
                    <p className="text-xs text-amber-200/70">Este balance representa los ingresos operativos procesados a través del sistema Mr Kings Arepa. Debe ser validado por el contador asignado antes de la presentación del Formulario 300/110.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {ventanaActiva === 'ticket' && data && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-2xl gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white italic flex items-center gap-2">
                    <TagIcon className="w-6 h-6 text-[#E50914]" /> Apartado Especial: Análisis de Ticket Promedio
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Valor medio por orden y rendimiento de consumo</p>
                </div>
                <button onClick={() => exportarCSV('TicketPromedio', { ticketPromedio: data.finanzas.ticketPromedio, transacciones: data.finanzas.transaccionesHoy })} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV Ticket
                </button>
              </div>
              <div className="bg-[#0f0f0f]/95 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-center bg-black/50 p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-slate-300 font-bold text-sm">Ticket Promedio Actual</span>
                  <span className="text-[#E50914] font-black text-3xl font-mono">${Number(data.finanzas.ticketPromedio || 0).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between items-center bg-black/50 p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-slate-300 font-bold text-sm">Total Órdenes Procesadas</span>
                  <span className="text-white font-black text-2xl font-mono">{data.finanzas.transaccionesHoy || 0}</span>
                </div>
              </div>
            </div>
          )}

          {ventanaActiva === 'metas' && data && (
            <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
              <MetaDiaria 
                ventasHoy={data.finanzas.ventasHoy} 
                metaVentas={metaVentas} 
                editandoMeta={editandoMeta} 
                inputMeta={inputMeta} 
                setInputMeta={setInputMeta} 
                guardarMeta={guardarMeta} 
                setEditandoMeta={setEditandoMeta} 
              />
            </div>
          )}

          {ventanaActiva === 'operacion' && data && (
            <div className="animate-in fade-in duration-300">
              <MetricasOperacion topProductos={data.operacion.topProductos} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}