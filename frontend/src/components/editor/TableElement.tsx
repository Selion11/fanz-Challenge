import { TableElement as TableType } from '@/types/map';

interface TableVisualProps {
  element: TableType;
  color: string;
  areaName: string;
  onDragStart: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export const TableVisual = ({ element, color, areaName, onDragStart, isSelected }: TableVisualProps) => {
  const sillaCount = element.sillas?.length || 0;
  const tableRadius = 30 + (sillaCount * 2);
  const chairDistance = tableRadius + 12;

  const borderColor = isSelected ? '#3b82f6' : color;

  return (
    <div className="relative flex items-center justify-center group select-none">
      <div 
        style={{ width: tableRadius * 2, height: tableRadius * 2, borderColor: borderColor, color: borderColor }}
        className={`absolute bg-white border-2 rounded-full flex flex-col items-center justify-center shadow-sm z-10 cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}`}
        onMouseDown={(e) => { e.stopPropagation(); onDragStart(e); }}
      >
        <span className="text-[6px] uppercase font-black opacity-50">{areaName}</span>
        <span className="text-[10px] font-black">{element.etiqueta}</span>
      </div>

      {element.sillas?.map((silla, idx) => {
        const angle = (idx * 2 * Math.PI) / sillaCount - Math.PI / 2;
        const x = Math.cos(angle) * chairDistance;
        const y = Math.sin(angle) * chairDistance;

        return (
          <div 
            key={idx}
            className="absolute w-4 h-4 rounded-full border-2 bg-white transition-colors"
            style={{ 
              transform: `translate(${x}px, ${y}px)`, 
              borderColor: borderColor, 
              boxShadow: isSelected ? '0 0 4px rgba(59, 130, 246, 0.5)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
};