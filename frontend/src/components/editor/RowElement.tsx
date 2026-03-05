import { RowElement as RowType } from '@/types/map';

interface RowVisualProps {
  element: RowType;
  color: string;
  areaName: string;
  onDragStart: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  onRotateStart?: (e: React.MouseEvent) => void;
  onCurveStart?: (e: React.MouseEvent) => void;
}

export const RowVisual = ({ element, color, areaName, onDragStart, isSelected, onRotateStart, onCurveStart }: RowVisualProps) => {
  const numAsientos = Number(element.asientos?.length || 0);
  const spacing = 35; 
  const curvatura = Number(element.curvatura || 0);
  const rotacion = Number(element.rotacion || 0);
  
  const curvaturaRad = curvatura * (Math.PI / 180);
  const isLineal = Math.abs(curvatura) < 1;
  const divisor = numAsientos > 1 ? numAsientos - 1 : 1;

  const seatBorderColor = isSelected ? '#3b82f6' : color;
  const seatBorderWidth = isSelected ? '2px' : '2px';
  const pathId = `path-${areaName}-${element.etiqueta}`.replace(/\s+/g, '-');

  const seatsRender = element.asientos?.map((asiento, i) => {
    let x = 0; let y = 0; let seatAngle = 0;

    if (isLineal) {
      x = (i - (numAsientos - 1) / 2) * spacing;
      y = 0;
      seatAngle = 0;
    } else {
      const radio = (numAsientos * spacing) / (curvaturaRad || 0.001);
      const baseTheta = -Math.PI / 2;
      const theta = baseTheta + (curvaturaRad * (i - (numAsientos - 1) / 2)) / divisor;
      
      x = radio * Math.cos(theta);
      y = radio * Math.sin(theta) + radio; 
      seatAngle = (theta * 180) / Math.PI + 90;
    }

    const upAngleRad = (seatAngle - 90) * (Math.PI / 180);
    const px = x + 25 * Math.cos(upAngleRad);
    const py = y + 25 * Math.sin(upAngleRad);

    return { x, y, seatAngle, px, py, identificador: asiento.identificador };
  }) || [];

  const pathD = seatsRender.length > 1 
    ? "M " + seatsRender.map(s => `${s.px},${s.py}`).join(" L ") 
    : seatsRender.length === 1 
      ? `M ${seatsRender[0].px - 20},${seatsRender[0].py} L ${seatsRender[0].px + 20},${seatsRender[0].py}`
      : "";

  return (
    <div 
      className="relative select-none group"
      style={{ 
        transform: `rotate(${rotacion}deg)`,
        transformOrigin: '0 0' 
      }}
    >
      <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, zIndex: 0 }}>
        {seatsRender.length > 0 && (
          <>
            <path 
              d={pathD} fill="none" stroke="transparent" strokeWidth="30" 
              className="pointer-events-auto cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }} 
            />
            <path 
              id={pathId} d={pathD} fill="none" stroke={seatBorderColor} 
              strokeWidth={isSelected ? "3" : "2"} 
              className={isSelected ? "opacity-100" : "opacity-40"} 
            />
            <text fill={seatBorderColor} className="text-[9px] font-black uppercase tracking-[0.2em] pointer-events-none" dy="-6">
              <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                {areaName} - {element.etiqueta}
              </textPath>
            </text>
          </>
        )}
      </svg>

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

      {isSelected && (
        <div className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 30 }}>
            <div className="absolute w-[2px] h-[140px] bg-gray-200/50" style={{ left: 0, top: -70, transform: 'translateX(-50%)' }} />
            
            <div
                className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-alias pointer-events-auto shadow-md hover:scale-110 transition-transform"
                style={{ left: 0, top: -70, transform: 'translate(-50%, -50%)' }}
                onMouseDown={(e) => { e.stopPropagation(); onRotateStart?.(e); }}
                title="Mantener click para rotar"
            >
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
            </div>

            <div
                className="absolute w-6 h-6 bg-white border-2 border-green-500 rounded-full flex items-center justify-center cursor-ns-resize pointer-events-auto shadow-md hover:scale-110 transition-transform"
                style={{ left: 0, top: 70, transform: 'translate(-50%, -50%)' }}
                onMouseDown={(e) => { e.stopPropagation(); onCurveStart?.(e); }}
                title="Mantener click para curvar"
            >
                 <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
        </div>
      )}
    </div>
  );
};