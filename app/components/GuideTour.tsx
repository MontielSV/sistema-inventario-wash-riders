'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface GuideTourProps {
  abierta: boolean;
  setVistaActiva: (vista: string) => void;
  tema: 'light' | 'dark';
  onClose: () => void;
}

const pasos = [
  {
    vista: 'dashboard',
    titulo: 'Tu resumen del día',
    descripcion: 'En Inicio consulta las ventas, los movimientos y los productos que necesitan atención.',
    consejo: 'Revisa el stock bajo antes de empezar a vender.',
  },
  {
    vista: 'productos',
    titulo: 'Prepara el catálogo',
    descripcion: 'En Productos busca o crea referencias y verifica que tengan precio y existencias correctas.',
    consejo: 'Un producto sin precio no se puede agregar a una venta.',
  },
  {
    vista: 'ventas',
    titulo: 'Agrega lo que vas a vender',
    descripcion: 'En Registrar venta busca cada producto por nombre o código, selecciónalo, indica la cantidad y agrégalo al carrito.',
    consejo: 'El sistema muestra las unidades disponibles y calcula el total.',
  },
  {
    vista: 'ventas',
    titulo: 'Confirma la venta',
    descripcion: 'Deja el tipo de movimiento en “Venta”, revisa los productos y el total, y entonces pulsa “Confirmar venta”.',
    consejo: 'Al confirmar, el inventario se actualiza y verás un código de seguimiento. La guía no registra ventas.',
  },
  {
    vista: 'historial',
    titulo: 'Consulta lo registrado',
    descripcion: 'En Historial revisa ventas y otros movimientos, con su detalle y código de seguimiento.',
    consejo: 'Úsalo para verificar una operación después de registrarla.',
  },
  {
    vista: 'reporte-ventas',
    titulo: 'Revisa tus resultados',
    descripcion: 'En Reporte de ventas consulta el resumen diario de las operaciones registradas.',
    consejo: 'Usa este resumen para revisar cómo va el día.',
  },
  {
    vista: 'pdf',
    titulo: 'Cierra con el reporte mensual',
    descripcion: 'En Reporte mensual consulta y descarga el consolidado del periodo.',
    consejo: 'Listo: ya conoces el recorrido básico para controlar inventario y vender.',
  },
];

export default function GuideTour({
  abierta,
  setVistaActiva,
  tema,
  onClose,
}: GuideTourProps) {
  const [pasoActual, setPasoActual] = useState(0);
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const paso = pasos[pasoActual];

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    if (abierta) {
      if (!dialogo.open) dialogo.showModal();
    }
    if (!abierta && dialogo.open) dialogo.close();
  }, [abierta, setVistaActiva]);

  const cerrarGuia = () => {
    window.localStorage.setItem('wash-riders-guide-completed', 'true');
    onClose();
  };

  const avanzar = () => {
    if (pasoActual === pasos.length - 1) {
      cerrarGuia();
      return;
    }
    const siguientePaso = pasoActual + 1;
    setPasoActual(siguientePaso);
    setVistaActiva(pasos[siguientePaso].vista);
  };

  const retroceder = () => {
    const pasoAnterior = Math.max(0, pasoActual - 1);
    setPasoActual(pasoAnterior);
    setVistaActiva(pasos[pasoAnterior].vista);
  };

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby="guide-tour-title"
      aria-describedby="guide-tour-description"
      onClose={onClose}
      className={`fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border p-0 shadow-2xl backdrop:bg-slate-950/65 ${
        tema === 'dark'
          ? 'border-slate-700 bg-[#10263b] text-slate-100'
          : 'border-blue-100 bg-white text-slate-900'
      }`}
    >
      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Guía rápida · Paso {pasoActual + 1} de {pasos.length}</p>
            <h2 id="guide-tour-title" className="mt-2 text-2xl font-black tracking-tight">{paso.titulo}</h2>
          </div>
          <button
            type="button"
            onClick={cerrarGuia}
            aria-label="Cerrar guía"
            className={`rounded-lg p-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              tema === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <XMarkIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <p id="guide-tour-description" className={`text-sm leading-6 ${tema === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {paso.descripcion}
        </p>
        <p className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${
          tema === 'dark'
            ? 'border-sky-900 bg-sky-950/50 text-sky-100'
            : 'border-blue-100 bg-blue-50 text-blue-900'
        }`}>
          <span className="font-bold">Consejo: </span>{paso.consejo}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={retroceder}
            disabled={pasoActual === 0}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              tema === 'dark'
                ? 'border-slate-600 text-slate-100 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" /> Anterior
          </button>
          <button
            type="button"
            onClick={avanzar}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1f5a8a] px-5 text-sm font-bold text-white transition-colors hover:bg-[#174a74] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {pasoActual === pasos.length - 1 ? 'Terminar guía' : 'Siguiente'}
            {pasoActual < pasos.length - 1 && <ArrowRightIcon aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={cerrarGuia}
          className={`mt-4 min-h-11 text-sm font-semibold underline underline-offset-4 ${
            tema === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Omitir guía
        </button>
      </div>
    </dialog>
  );
}
