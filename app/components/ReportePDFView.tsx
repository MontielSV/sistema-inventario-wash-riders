'use client';
import { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function ReportePDFView() {
  const [datos, setDatos] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/inventario')
      .then(res => res.json())
      .then(data => setDatos(Array.isArray(data) ? data : []));
  }, []);

  const imprimirPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center pb-6 border-b border-white/10 print:hidden">
          <div>
            <h1 className="text-3xl font-black italic text-white flex items-center gap-3">
              <DocumentArrowDownIcon className="w-8 h-8 text-[#E50914]" /> Reporte PDF Mensual
            </h1>
            <p className="text-xs text-slate-400">Generador de informes impresos y exportables</p>
          </div>
          <button
            onClick={imprimirPDF}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase flex items-center gap-2 shadow-lg"
          >
            <PrinterIcon className="w-4 h-4" /> Guardar como PDF / Imprimir
          </button>
        </header>

        {/* Documento Imprimible */}
        <div className="bg-white text-black p-8 rounded-2xl shadow-2xl space-y-6 print:p-0 print:shadow-none">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-2xl font-black italic">WASH RIDERS</h2>
              <p className="text-xs text-gray-600">Reporte de Control de Inventario y Movimientos</p>
            </div>
            <div className="text-right text-xs font-mono">
              <p>Fecha: {new Date().toLocaleDateString('es-CO')}</p>
              <p>Estado: Oficial</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black font-bold uppercase">
                <th className="py-2">Fecha</th>
                <th className="py-2">Producto</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Cantidad</th>
                <th className="py-2">Nota/Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {datos.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 font-mono">{new Date(item.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="py-2 font-bold">{item.nombre_producto || `ID ${item.producto_id}`}</td>
                  <td className="py-2 uppercase font-bold">{item.tipo}</td>
                  <td className="py-2 font-mono font-bold">{item.cantidad}</td>
                  <td className="py-2 text-gray-600">{item.nota || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}