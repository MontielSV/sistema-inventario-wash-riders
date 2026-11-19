'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
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

interface ActivityResponse {
  entries: ActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
}

const actionLabels: Record<string, string> = {
  inicio_sesion: 'Inicio de sesión',
  cierre_sesion: 'Cierre de sesión',
  intento_fallido: 'Acceso rechazado',
  crear: 'Creación',
  editar: 'Edición',
  eliminar: 'Retiro o eliminación',
  registrar: 'Registro',
  importar: 'Importación',
  cerrar_caja: 'Cierre de caja',
};

const entityLabels: Record<string, string> = {
  sesion: 'Sesión',
  producto: 'Producto',
  movimiento_inventario: 'Movimiento de inventario',
  venta: 'Venta',
  salida_inventario: 'Salida de inventario',
  configuracion_negocio: 'Configuración del negocio',
  catalogo_productos: 'Catálogo de productos',
  receta_producto: 'Receta',
  recetas: 'Recetas',
  meta_diaria: 'Meta diaria',
  pedido: 'Pedido',
  caja: 'Caja',
  usuario: 'Usuario',
};

const detailLabels: Record<string, string> = {
  anterior: 'Antes',
  nuevo: 'Después',
  agregados: 'Productos agregados',
  agente_usuario: 'Dispositivo',
  cantidad: 'Cantidad',
  cantidad_usada: 'Cantidad usada',
  categoria: 'Categoría',
  codigo: 'Código',
  codigo_producto: 'Código del producto',
  codigo_seguimiento: 'Código de seguimiento',
  costo_domicilio: 'Costo de domicilio',
  descuento_web_activo: 'Descuento web activo',
  descuento_web_porcentaje: 'Descuento web',
  direccion: 'Dirección',
  disponible: 'Disponible',
  estado_anterior: 'Estado anterior',
  estado_nuevo: 'Estado nuevo',
  existentes: 'Ya existentes',
  fecha: 'Fecha',
  filas_procesadas: 'Filas procesadas',
  hora_apertura: 'Hora de apertura',
  hora_cierre: 'Hora de cierre',
  id: 'ID',
  insumo_id: 'ID del insumo',
  items: 'Productos de la operación',
  metodo_pago: 'Método de pago',
  motivo: 'Motivo',
  motivo_tipo: 'Tipo de motivo',
  nombre: 'Nombre',
  nombre_negocio: 'Nombre del negocio',
  nombre_producto: 'Producto',
  nota: 'Nota',
  nueva_meta: 'Nueva meta diaria',
  pedidos_cerrados: 'Pedidos cerrados',
  precio: 'Precio',
  precio_unitario: 'Precio unitario',
  producto_id: 'ID del producto',
  productos: 'Productos',
  stock_actual: 'Existencias',
  stock_anterior: 'Existencias anteriores',
  stock_minimo: 'Stock mínimo',
  stock_nuevo: 'Existencias nuevas',
  tipo: 'Tipo',
  total: 'Total',
  transaccion_id: 'ID de transacción',
  usuario: 'Usuario',
  usuario_id: 'ID del usuario',
  valor_movimiento: 'Valor del movimiento',
};

const currencyFields = new Set([
  'costo_domicilio',
  'precio',
  'precio_unitario',
  'total',
  'valor_movimiento',
]);

const enumLabels: Record<string, string> = {
  AJUSTE: 'Ajuste',
  COMPRA: 'Compra',
  DONACION: 'Donación',
  DANO: 'Daño',
  ENTRADA: 'Entrada',
  OTRO: 'Otro',
  SALIDA: 'Salida',
  USO_INTERNO: 'Uso interno',
  VENTA: 'Venta',
};

const actionTone: Record<string, string> = {
  inicio_sesion: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  cierre_sesion: 'border-slate-200 bg-slate-100 text-slate-700',
  intento_fallido: 'border-red-200 bg-rose-50 text-rose-800',
  crear: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  editar: 'border-blue-200 bg-blue-50 text-blue-800',
  eliminar: 'border-red-200 bg-rose-50 text-rose-800',
  registrar: 'border-blue-200 bg-blue-50 text-blue-800',
  importar: 'border-blue-200 bg-blue-50 text-blue-800',
  cerrar_caja: 'border-amber-200 bg-amber-50 text-amber-800',
};

const asRecord = (value: unknown): Record<string, unknown> | null => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
);

const textValue = (value: unknown) => (
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''
);

const formatCurrency = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount)
    : textValue(value);
};

const getEntityLabel = (entity: string) => (
  entityLabels[entity] ?? entity.replaceAll('_', ' ')
);

function getActionSummary(entry: ActivityEntry) {
  const details = entry.detalles ?? {};
  const old = asRecord(details.anterior);
  const updated = asRecord(details.nuevo);
  const itemCount = Array.isArray(details.items) ? details.items.length : 0;

  if (entry.entidad === 'sesion') {
    if (entry.accion === 'inicio_sesion') return `${entry.usuario} inició sesión`;
    if (entry.accion === 'cierre_sesion') return `${entry.usuario} cerró sesión`;
    return `Intento de acceso fallido para «${textValue(details.usuario) || entry.usuario}»`;
  }

  if (entry.entidad === 'producto') {
    const product = updated ?? details;
    const name = textValue(product.nombre) || 'producto';
    const code = textValue(product.codigo);
    const identity = `«${name}»${code ? ` (${code})` : ''}`;
    if ('disponible' in details) {
      return `${details.disponible ? 'Activó' : 'Desactivó'} el producto ${identity}`;
    }
    if (entry.accion === 'crear') return `Creó el producto ${identity}`;
    if (entry.accion === 'eliminar') return `Retiró del catálogo el producto ${identity}`;
    if (entry.accion === 'editar') {
      const changed = old && updated
        ? Object.keys(updated).filter((key) => JSON.stringify(old[key]) !== JSON.stringify(updated[key]))
        : [];
      const fields = changed.map((key) => detailLabels[key] ?? key.replaceAll('_', ' '));
      return `Actualizó el producto ${identity}${fields.length ? ` · Cambió: ${fields.join(', ')}` : ''}`;
    }
    return `${actionLabels[entry.accion] ?? entry.accion} el producto ${identity}`;
  }

  if (entry.entidad === 'movimiento_inventario') {
    const movement = updated ?? details;
    const movementType = enumLabels[textValue(movement.tipo)] ?? 'movimiento';
    const quantity = textValue(movement.cantidad) || 'cantidad no especificada';
    const product = textValue(movement.nombre_producto)
      || textValue(details.nombre_producto)
      || `producto #${textValue(movement.producto_id) || '?'}`;
    const reason = textValue(movement.motivo) || textValue(movement.motivo_tipo);
    return `${entry.accion === 'editar' ? 'Actualizó' : 'Registró'} ${movementType.toLowerCase()} de ${quantity} unidades de ${product}${reason ? ` · ${reason}` : ''}`;
  }

  if (entry.entidad === 'venta' || entry.entidad === 'salida_inventario') {
    const type = enumLabels[textValue(details.tipo)] ?? 'Salida';
    const operation = type === 'Venta' ? 'Venta' : `Salida por ${type.toLowerCase()}`;
    const total = details.total === undefined ? '' : ` · Total ${formatCurrency(details.total)}`;
    const items = itemCount ? ` · ${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}` : '';
    const reason = textValue(details.motivo);
    return `${operation} registrada${items}${total}${reason ? ` · ${reason}` : ''}`;
  }

  if (entry.entidad === 'pedido') {
    const customer = textValue(details.cliente_nombre) || 'cliente sin nombre';
    if (entry.accion === 'crear') return `Creó un pedido para ${customer}${details.total === undefined ? '' : ` · ${formatCurrency(details.total)}`}`;
    if (entry.accion === 'editar') {
      return `Cambió el estado del pedido de ${customer}: ${textValue(details.estado_anterior)} → ${textValue(details.estado_nuevo)}`;
    }
  }

  if (entry.entidad === 'caja') {
    const count = Number(details.pedidos_cerrados ?? 0);
    return `Cerró la caja · ${count} ${count === 1 ? 'pedido' : 'pedidos'} · ${formatCurrency(details.total)}`;
  }

  if (entry.entidad === 'catalogo_productos') {
    return `Sincronizó el catálogo · ${textValue(details.agregados) || 0} agregados · ${textValue(details.existentes) || 0} ya existían`;
  }

  if (entry.entidad === 'recetas' || entry.entidad === 'receta_producto') {
    const count = Array.isArray(details.ingredientes)
      ? details.ingredientes.length
      : Number(details.filas_procesadas ?? 0);
    return `${entry.accion === 'importar' ? 'Importó' : 'Actualizó'} una receta · ${count} ${count === 1 ? 'ingrediente o fila' : 'ingredientes o filas'}`;
  }

  if (entry.entidad === 'meta_diaria') {
    return `Actualizó la meta diaria a ${formatCurrency(details.nueva_meta)}`;
  }

  if (entry.entidad === 'configuracion_negocio') {
    const changed = Object.keys(details).map((key) => detailLabels[key] ?? key.replaceAll('_', ' '));
    return `Actualizó la configuración del negocio${changed.length ? ` · ${changed.join(', ')}` : ''}`;
  }

  const entity = getEntityLabel(entry.entidad).toLowerCase();
  const identifier = entry.entidad_id ? ` #${entry.entidad_id}` : '';
  return `${actionLabels[entry.accion] ?? entry.accion} ${entity}${identifier}`;
}

function formatDetailValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (currencyFields.has(field) && (typeof value === 'number' || !Number.isNaN(Number(value)))) {
    return formatCurrency(value);
  }
  if (field === 'fecha' && typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }
  if (typeof value === 'string') return enumLabels[value] ?? value;
  if (typeof value === 'number') return new Intl.NumberFormat('es-CO').format(value);
  return String(value);
}

function DetailValue({ value, field = '' }: { value: unknown; field?: string }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-500">Sin elementos</span>;
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={`${field}-${index}`} className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-800">
              {field === 'items' ? `Producto ${index + 1}` : `Elemento ${index + 1}`}
            </p>
            <DetailValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  const record = asRecord(value);
  if (record) {
    const values = Object.entries(record);
    if (values.length === 0) return <span className="text-slate-500">Sin datos adicionales</span>;
    return (
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {values.map(([key, item]) => (
          <div key={key} className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {detailLabels[key] ?? key.replaceAll('_', ' ')}
            </dt>
            <dd className="mt-0.5 break-words text-sm text-slate-800">
              <DetailValue value={item} field={key} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <>{formatDetailValue(field, value)}</>;
}

export default function HistorialActividadView() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/historial?page=${page}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el historial de actividad.');
      const data: ActivityResponse = await response.json();
      setEntries(data.entries);
      setTotal(data.total);
      setPageSize(data.pageSize);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error al cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastEntry = Math.min(page * pageSize, total);

  return (
    <section className="mx-auto w-full max-w-[1600px]">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => void loadEntries()}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-900 shadow-sm transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </div>
      )}

      {loading && entries.length === 0 ? (
        <div role="status" className="rounded-xl border border-blue-100 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-600 shadow-sm">
          Cargando actividad...
        </div>
      ) : entries.length > 0 ? (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
              <article>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${actionTone[entry.accion] ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                    {actionLabels[entry.accion] ?? entry.accion}
                  </span>
                  <time dateTime={entry.fecha} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CalendarIcon aria-hidden="true" className="h-4 w-4" />
                    {new Date(entry.fecha).toLocaleString()}
                  </time>
                </div>

                <h2 className="mt-3 text-base font-bold leading-6 text-blue-900 sm:text-lg">
                  {getActionSummary(entry)}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <UserCircleIcon aria-hidden="true" className="h-4 w-4 text-blue-700" />
                    {entry.usuario}
                  </span>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                    {getEntityLabel(entry.entidad)}{entry.entidad_id ? ` #${entry.entidad_id}` : ''}
                  </span>
                </div>

                <details className="group mt-4 border-t border-blue-100 pt-3">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-2 text-sm font-bold text-blue-800 outline-none transition hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
                    Ver toda la información
                    <ChevronDownIcon aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-2 rounded-lg bg-blue-50 p-3 sm:p-4">
                    <DetailValue value={entry.detalles} />
                    <div className="mt-4 grid gap-3 border-t border-blue-100 pt-3 text-xs sm:grid-cols-3">
                      <div className="min-w-0">
                        <p className="font-bold uppercase tracking-wide text-slate-500">IP</p>
                        <p className="mt-1 break-words text-slate-700">{entry.ip || 'No disponible'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold uppercase tracking-wide text-slate-500">Origen</p>
                        <p className="mt-1 inline-flex items-start gap-1 break-all text-slate-700">
                          <GlobeAltIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-700" />
                          {entry.origen || 'No disponible'}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold uppercase tracking-wide text-slate-500">Dispositivo</p>
                        <p className="mt-1 inline-flex items-start gap-1 break-words text-slate-700">
                          <ComputerDesktopIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-700" />
                          {entry.agente_usuario || 'No disponible'}
                        </p>
                      </div>
                    </div>
                  </div>
                </details>

              </article>
            </li>
          ))}
        </ol>
      ) : (
        !loading && (
          <div className="rounded-xl border border-blue-100 bg-white px-4 py-12 text-center shadow-sm">
            <ClockIcon aria-hidden="true" className="mx-auto h-9 w-9 text-blue-300" />
            <p className="mt-3 font-bold text-blue-900">Aún no hay actividad registrada</p>
            <p className="mt-1 text-sm text-slate-500">Las acciones realizadas aparecerán aquí.</p>
          </div>
        )
      )}

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        <p aria-live="polite">
          {total === 0 ? 'Sin eventos' : `Mostrando ${firstEntry}–${lastEntry} de ${total} eventos`}
        </p>
        <nav aria-label="Paginación del historial de actividad" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={loading || page <= 1}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 font-bold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Anterior
          </button>
          <span aria-live="polite" className="whitespace-nowrap font-medium">Página {page} de {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={loading || page >= totalPages}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 font-bold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Siguiente
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </nav>
      </footer>
    </section>
  );
}
