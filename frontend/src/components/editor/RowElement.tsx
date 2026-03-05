import { RowElement as RowType } from '@/types/map';

interface RowVisualProps {
  element: RowType;
  color: string;
  areaName: string;
  onDragStart: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export const RowVisual = ({ element, color, areaName, onDragStart, isSelected }: RowVisualProps) => {
  const numAsientos = element.asientos?.length || 0;
  const spacing = 35; 
  const curvatura = element.curvatura || 0;
  const curvaturaRad = curvatura * (Math.PI / 180);
  const isLineal = Math.abs(curvatura) < 1;
  const divisor = numAsientos > 1 ? numAsientos - 1 : 1;

  const seatBorderColor = isSelected ? '#3b82f6' : color;
  const seatBorderWidth = isSelected ? '2px' : '2px';
  const pathId = `path-${areaName}-${element.etiqueta}`.replace(/\s+/g, '-');

  // 1. Calculamos la posición de cada asiento y su respectivo punto en la línea conectora
  const seatsRender = element.asientos?.map((asiento, i) => {
    let x = 0; let y = 0; let seatAngle = 0;

    if (isLineal) {
      x = (i - (numAsientos - 1) / 2) * spacing;
      y = 0;
      seatAngle = 0;
    } else {
      const radio = (numAsientos * spacing) / (curvaturaRad || 0.001);
      // Centramos el arco en el eje Y local para que alinear la rotación sea natural
      const baseTheta = -Math.PI / 2;
      const theta = baseTheta + (curvaturaRad * (i - (numAsientos - 1) / 2)) / divisor;
      
      x = radio * Math.cos(theta);
      y = radio * Math.sin(theta) + radio; 
      seatAngle = (theta * 180) / Math.PI + 90;
    }

    // Calculamos el punto de la línea SVG (25px por encima del asiento siguiendo su normal)
    const upAngleRad = (seatAngle - 90) * (Math.PI / 180);
    const px = x + 25 * Math.cos(upAngleRad);
    const py = y + 25 * Math.sin(upAngleRad);

    return { x, y, seatAngle, px, py, identificador: asiento.identificador };
  }) || [];

  // 2. Generamos el SVG Path que une esos puntos
  const pathD = seatsRender.length > 1 
    ? "M " + seatsRender.map(s => `${s.px},${s.py}`).join(" L ") 
    : seatsRender.length === 1 
      ? `M ${seatsRender[0].px - 20},${seatsRender[0].py} L ${seatsRender[0].px + 20},${seatsRender[0].py}`
      : "";

  return (
    <div 
      className="relative select-none group"
      style={{ 
        // Rotamos todo el conjunto desde el centro (0,0)
        transform: `rotate(${element.rotacion || 0}deg)`,
        transformOrigin: '0 0' 
      }}
    >
      {/* CAPA 1: Línea conectora y Etiqueta en SVG */}
      <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, zIndex: 0 }}>
        {seatsRender.length > 0 && (
          <>
            {/* Manillar invisible y grueso para facilitar el drag & drop */}
            <path 
              d={pathD} fill="none" stroke="transparent" strokeWidth="30" 
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }} 
            />
            {/* Línea visible de la etiqueta */}
            <path 
              id={pathId} d={pathD} fill="none" stroke={seatBorderColor} 
              strokeWidth={isSelected ? "3" : "2"} 
              className={isSelected ? "opacity-100" : "opacity-40"} 
            />
            {/* Texto que sigue la curvatura del path */}
            <text fill={seatBorderColor} className="text-[9px] font-black uppercase tracking-[0.2em] pointer-events-none" dy="-6">
              <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                {areaName} - {element.etiqueta}
              </textPath>
            </text>
          </>
        )}
      </svg>

      {/* CAPA 2: Asientos */}
      <div className="relative">
        {seatsRender.map((s, i) => (
          <div 
            key={i}
            className={`absolute w-7 h-7 bg-white rounded-lg flex items-center justify-center transition-transform shadow-sm ${isSelected ? 'shadow-blue-200' : ''}`}
            style={{ 
              left: s.x, top: s.y,
              borderWidth: seatBorderWidth,
              borderColor: seatBorderColor,
              transform: `translate(-50%, -50%) rotate(${s.seatAngle}deg)`,
              zIndex: isSelected ? 20 : 1
            }}
          >
            <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-600' : ''}`}>
              {s.identificador}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};