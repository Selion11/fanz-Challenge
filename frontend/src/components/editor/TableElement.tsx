import { TableElement as TableType } from '@/types/map';

interface TableVisualProps {
  element: TableType;
  color: string;
  areaName: string;
  onDragStart: (e: React.MouseEvent) => void;
}

export const TableVisual = ({ element, color, areaName, onDragStart }: TableVisualProps) => {
  const sillaCount = element.sillas?.length || 0;
  const tableRadius = 30 + (sillaCount * 2);
  const chairDistance = tableRadius + 12;

  return (
    <div 
      className="relative flex items-center justify-center group select-none" 
      style={{ width: chairDistance * 2.5, height: chairDistance * 2.5 }}
    >
      <div 
        style={{ 
          width: tableRadius * 2, 
          height: tableRadius * 2,
          borderColor: color,
          color: color
        }}
        className="absolute bg-white border-2 rounded-full flex items-center justify-center shadow-sm z-10 cursor-grab active:cursor-grabbing transition-transform group-hover:scale-105"
        title={`Área: ${areaName}\nMesa: ${element.etiqueta}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(e); 
        }}
      >
        <span className="text-[10px] font-black">{element.etiqueta}</span>
      </div>

      {element.sillas?.map((silla, idx) => {
        const angle = (idx * 2 * Math.PI) / sillaCount - Math.PI / 2;
        const x = Math.cos(angle) * chairDistance;
        const y = Math.sin(angle) * chairDistance;

        return (
          <div 
            key={idx}
            className="absolute w-4 h-4 rounded-full border-2 bg-white cursor-help"
            style={{ 
              transform: `translate(${x}px, ${y}px)`,
              borderColor: color,
            }}
            title={`Área: ${areaName}\nMesa: ${element.etiqueta}\nPrecio: $${element.precio}`}
          />
        );
      })}
    </div>
  );
};