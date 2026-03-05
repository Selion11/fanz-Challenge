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
  const curvaturaRad = (element.curvatura || 0) * (Math.PI / 180);
  const rotacionRad = (element.rotacion || 0) * (Math.PI / 180);
  const isLineal = Math.abs(element.curvatura || 0) < 1;
  const divisor = numAsientos > 1 ? numAsientos - 1 : 1;

  const seatBorderColor = isSelected ? '#3b82f6' : color;
  const seatBorderWidth = isSelected ? '2px' : '2px';

  return (
    <div className="relative select-none group">
      <div 
        className={`absolute z-30 flex flex-col items-center cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-all bg-white border shadow-md ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        style={{ 
          transform: 'translate(-50%, -160%)', 
          left: '0', top: '0',
          borderColor: isSelected ? '#3b82f6' : color + '40'
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(e);
        }}
      >
        <span className="text-[7px] uppercase font-black opacity-60 tracking-widest" style={{ color: isSelected ? '#3b82f6' : color }}>
          {areaName}
        </span>
        <span className="text-[11px] font-black" style={{ color: isSelected ? '#3b82f6' : color }}>
          {element.etiqueta}
        </span>
      </div>

      <div className="relative">
        {element.asientos?.map((asiento, i) => {
          let x = 0; let y = 0; let seatAngle = 0;

          if (isLineal) {
            const offset = (i - (numAsientos - 1) / 2) * spacing;
            x = offset * Math.cos(rotacionRad);
            y = offset * Math.sin(rotacionRad);
            seatAngle = element.rotacion || 0;
          } else {
            const radio = (numAsientos * spacing) / (curvaturaRad || 0.001);
            const theta = rotacionRad + (curvaturaRad * (i - (numAsientos - 1) / 2)) / divisor;
            
            x = radio * Math.cos(theta) - (radio * Math.cos(rotacionRad));
            y = radio * Math.sin(theta) - (radio * Math.sin(rotacionRad));
            seatAngle = (theta * 180) / Math.PI + 90;
          }

          return (
            <div 
              key={i}
              className={`absolute w-7 h-7 bg-white rounded-lg flex items-center justify-center transition-transform shadow-sm ${isSelected ? 'shadow-blue-200' : ''}`}
              style={{ 
                left: x, top: y,
                borderWidth: seatBorderWidth,
                borderColor: seatBorderColor,
                transform: `translate(-50%, -50%) rotate(${seatAngle}deg)`,
                zIndex: isSelected ? 20 : 1
              }}
            >
              <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-600' : ''}`}>
                {asiento.identificador}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};