import { RowElement as RowType } from '@/types/map';

interface RowVisualProps {
  element: RowType;
  color: string;
  areaName: string;
  onDragStart: (e: React.MouseEvent) => void;
}

export const RowVisual = ({ element, color, areaName, onDragStart }: RowVisualProps) => {
  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg group select-none">
      <div className="flex items-center gap-4">
        <span 
          className="text-xs font-bold w-12 truncate cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded px-1 transition-colors" 
          style={{ color: color }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onDragStart(e); 
          }}
        >
          {element.etiqueta}
        </span>
        
        <div className="flex gap-1.5">
          {element.asientos?.map((asiento, idx) => (
            <div 
              key={idx}
              className="w-5 h-5 bg-white border-2 rounded-md flex items-center justify-center transition-all cursor-help"
              style={{ borderColor: color }}
              title={`Área: ${areaName}\nFila: ${element.etiqueta}\nAsiento: ${asiento.identificador || idx + 1}\nPrecio: $${element.precio}`}
            >
              <span className="text-[8px] font-bold">{asiento.identificador || idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};