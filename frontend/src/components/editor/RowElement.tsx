import { RowElement as RowType } from '@/types/map';

interface RowVisualProps {
  element: RowType;
  color: string;
  areaName: string;
}

export const RowVisual = ({ element, color, areaName }: RowVisualProps) => {
  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg group">
      <div className="flex items-center gap-4">
        <span 
          className="text-xs font-bold w-12 truncate" 
          style={{ color: color }}
        >
          {element.etiqueta}
        </span>
        <div className="flex gap-1.5">
          {element.asientos?.map((asiento, idx) => (
            <div 
              key={idx}
              className="w-5 h-5 bg-white border-2 rounded-md flex items-center justify-center transition-all cursor-help hover:bg-opacity-10"
              style={{ 
                borderColor: color,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = color;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'inherit';
              }}
              // Tooltip con información contextual completa
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