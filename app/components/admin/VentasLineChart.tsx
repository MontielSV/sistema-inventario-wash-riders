'use client';

import { useState } from 'react';

interface PuntoGrafica {
  etiqueta: string;
  valor: number;
  detalle?: string;
}

interface VentasLineChartProps {
  puntos: PuntoGrafica[];
  descripcion: string;
}

const compactarValor = (valor: number) => {
  if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)} M`;
  if (valor >= 1000) return `$${(valor / 1000).toFixed(0)} mil`;
  return `$${Math.round(valor)}`;
};

export default function VentasLineChart({ puntos, descripcion }: VentasLineChartProps) {
  const [puntoActivo, setPuntoActivo] = useState<number | null>(null);
  const ancho = 760;
  const alto = 244;
  const izquierda = 58;
  const derecha = 16;
  const arriba = 18;
  const abajo = 204;
  const anchoGrafica = ancho - izquierda - derecha;
  const altoGrafica = abajo - arriba;
  const maximo = Math.max(1, ...puntos.map((punto) => punto.valor));
  const posiciones = puntos.map((punto, indice) => ({
    ...punto,
    x: puntos.length < 2 ? izquierda + anchoGrafica / 2 : izquierda + (indice / (puntos.length - 1)) * anchoGrafica,
    y: abajo - (punto.valor / maximo) * altoGrafica,
  }));
  const linea = posiciones.map((punto) => `${punto.x},${punto.y}`).join(' ');
  const area = posiciones.length
    ? `${posiciones[0].x},${abajo} ${linea} ${posiciones[posiciones.length - 1].x},${abajo}`
    : '';
  const intervaloEtiqueta = Math.max(1, Math.ceil(puntos.length / 7));
  const anchoPanel = 190;
  const altoPanel = 56;
  const puntoSeleccionado = puntoActivo === null ? null : posiciones[puntoActivo];
  const panelX = puntoSeleccionado
    ? Math.max(izquierda, Math.min(puntoSeleccionado.x - anchoPanel / 2, ancho - derecha - anchoPanel))
    : 0;
  const panelY = puntoSeleccionado
    ? puntoSeleccionado.y > arriba + altoPanel + 12
      ? puntoSeleccionado.y - altoPanel - 12
      : Math.min(puntoSeleccionado.y + 12, alto - altoPanel - 8)
    : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="h-auto min-w-[560px] w-full overflow-visible"
        preserveAspectRatio="none"
        role="group"
        aria-label={descripcion}
      >
        {[0, 1, 2, 3].map((indice) => {
          const y = arriba + (altoGrafica / 3) * indice;
          const valor = maximo * (1 - indice / 3);
          return (
            <g key={indice}>
              <line x1={izquierda} x2={ancho - derecha} y1={y} y2={y} stroke="#e7edf3" strokeDasharray="3 5" />
              <text x={izquierda - 8} y={y + 4} textAnchor="end" fill="#718096" fontSize="10">{compactarValor(valor)}</text>
            </g>
          );
        })}
        {area && <polygon points={area} fill="#3987c4" fillOpacity="0.10" />}
        {linea && <polyline points={linea} fill="none" stroke="#28699e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
        {posiciones.map((punto, indice) => {
          const mostrarEtiqueta = indice === 0 || indice === posiciones.length - 1 || indice % intervaloEtiqueta === 0;
          const detalle = punto.detalle || `${punto.etiqueta}: $${punto.valor.toLocaleString('es-CO')} COP`;
          return (
            <g key={`${punto.etiqueta}-${indice}`}>
              <rect
                x={punto.x - 9}
                y={arriba}
                width="18"
                height={alto - arriba - 8}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={detalle}
                onMouseEnter={() => setPuntoActivo(indice)}
                onMouseLeave={() => setPuntoActivo(null)}
                onFocus={() => setPuntoActivo(indice)}
                onBlur={() => setPuntoActivo(null)}
              />
              <circle cx={punto.x} cy={punto.y} r="3.5" fill="#fff" stroke="#28699e" strokeWidth="2" vectorEffect="non-scaling-stroke" pointerEvents="none" />
              {mostrarEtiqueta && <text x={punto.x} y={alto - 13} textAnchor="middle" fill="#64748b" fontSize="10" pointerEvents="none">{punto.etiqueta}</text>}
            </g>
          );
        })}
        {puntoSeleccionado && (
          <g pointerEvents="none" aria-hidden="true">
            <rect x={panelX} y={panelY} width={anchoPanel} height={altoPanel} rx="8" fill="#0f172a" stroke="#3987c4" strokeWidth="1.5" />
            <text x={panelX + 12} y={panelY + 22} fill="#cbd5e1" fontSize="11">Día {puntoSeleccionado.etiqueta}</text>
            <text x={panelX + 12} y={panelY + 43} fill="#fff" fontSize="14" fontWeight="700">
              ${puntoSeleccionado.valor.toLocaleString('es-CO')} COP
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
