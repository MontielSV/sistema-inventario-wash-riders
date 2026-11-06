'use client';

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

  return (
    <div className="w-full overflow-x-auto" role="img" aria-label={descripcion}>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto min-w-[560px] w-full overflow-visible" preserveAspectRatio="none">
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
          return (
            <g key={`${punto.etiqueta}-${indice}`}>
              <circle cx={punto.x} cy={punto.y} r="3.5" fill="#fff" stroke="#28699e" strokeWidth="2" vectorEffect="non-scaling-stroke">
                <title>{punto.detalle || `${punto.etiqueta}: ${compactarValor(punto.valor)}`}</title>
              </circle>
              {mostrarEtiqueta && <text x={punto.x} y={alto - 13} textAnchor="middle" fill="#64748b" fontSize="10">{punto.etiqueta}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
