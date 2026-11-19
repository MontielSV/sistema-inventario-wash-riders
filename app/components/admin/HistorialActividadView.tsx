'use client';

import { useEffect, useState } from 'react';
import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ActivityEntry {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalles: Record<string, unknown>;
  ip: string | null;
  agente_usuario: string | null;
  origen: string | null;
}

const actionLabels: Record<string, string> = {
  inicio_sesion: 'Inició sesión',
  cierre_sesion: 'Cerró sesión',
  intento_fallido: 'Intento de acceso fallido',
  crear: 'Creó',
  editar: 'Editó',
  eliminar: 'Eliminó / retiró',
  registrar: 'Registró',
  importar: 'Importó',
  cerrar_caja: 'Cerró caja',
};

const readable = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export default function HistorialActividadView() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/historial', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el historial de actividad.');
      setEntries(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error al cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl p-4 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#123b60] dark:text-blue-100">
            <ClockIcon className="h-7 w-7" />
            Bitácora de actividad
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sesiones y cambios realizados. Se muestran los 500 eventos más recientes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadEntries()}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </header>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Fecha y hora</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Elemento</th>
              <th className="px-4 py-3">Detalles</th>
              <th className="px-4 py-3">Origen / dispositivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="align-top text-slate-700 dark:text-slate-200">
                <td className="whitespace-nowrap px-4 py-3">
                  {new Date(entry.fecha).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-semibold">{entry.usuario}</td>
                <td className="px-4 py-3">{actionLabels[entry.accion] ?? entry.accion}</td>
                <td className="px-4 py-3">
                  {entry.entidad}{entry.entidad_id ? ` #${entry.entidad_id}` : ''}
                </td>
                <td className="max-w-md whitespace-pre-wrap break-words px-4 py-3 text-xs">
                  {readable(entry.detalles)}
                </td>
                <td className="max-w-xs break-words px-4 py-3 text-xs">
                  <div>{entry.ip || 'IP no disponible'}</div>
                  <div className="mt-1 text-slate-500">{entry.origen || 'Origen no disponible'}</div>
                  <div className="mt-1 text-slate-500">{entry.agente_usuario || 'Dispositivo no disponible'}</div>
                </td>
              </tr>
            ))}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Aún no hay actividad registrada.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Cargando historial...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
