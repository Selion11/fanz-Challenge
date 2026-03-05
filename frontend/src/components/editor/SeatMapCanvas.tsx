import React, { useState, useRef } from 'react';
import { SeatMap, MapElement, ElementPosition } from '@/types/map';
import { RowVisual } from './RowElement';
import { TableVisual } from './TableElement';

interface SeatMapCanvasProps {
  map: SeatMap;
  onUpdateMap: (newMap: SeatMap) => void;
}

export const SeatMapCanvas = ({ map, onUpdateMap }: SeatMapCanvasProps) => {
  const [activeDrag, setActiveDrag] = useState<{
    areaId: string;
    label: string;
    currentPos: ElementPosition;
    offset: ElementPosition;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (areaId: string, elemento: MapElement, e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setActiveDrag({
      areaId,
      label: elemento.etiqueta,
      currentPos: { ...elemento.posicion },
      offset: {
        x: mouseX - elemento.posicion.x,
        y: mouseY - elemento.posicion.y
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeDrag || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    setActiveDrag(prev => prev ? ({
      ...prev,
      currentPos: {
        x: e.clientX - rect.left - prev.offset.x,
        y: e.clientY - rect.top - prev.offset.y
      }
    }) : null);
  };

  const handleMouseUp = () => {
    if (!activeDrag) return;
    const newMap = { ...map };
    const area = newMap.areas.find(a => a.id === activeDrag.areaId);
    const element = area?.elementos.find(el => el.etiqueta === activeDrag.label);

    if (element) {
      element.posicion = activeDrag.currentPos;
      onUpdateMap(newMap);
    }
    setActiveDrag(null);
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100 p-12 min-h-[120vh] relative overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{map.nombre_plano}</h2>
        <div className="h-1 w-20 bg-black mx-auto mt-2 rounded-full" />
      </div>

      <div className="relative h-full">
        {/* --- ESCENARIO RESTAURADO --- */}
        <div className="mb-32 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50">
          <span className="text-sm font-black text-gray-300 uppercase tracking-[1em]">
            ESCENARIO / STAGE
          </span>
        </div>
        {/* ---------------------------- */}

        {map.areas.map((area) => (
          <React.Fragment key={area.id}>
            {area.elementos.map((elemento, index) => {
              const isDragging = activeDrag?.label === elemento.etiqueta && activeDrag?.areaId === area.id;
              const basePos = elemento.posicion || { x: 50, y: 150 };
              const displayPos = isDragging ? activeDrag.currentPos : basePos;

              return (
                <div 
                  key={`${area.id}-${index}`}
                  className="absolute"
                  style={{ 
                    left: displayPos.x, 
                    top: displayPos.y,
                    zIndex: isDragging ? 50 : 10,
                    transition: isDragging ? 'none' : 'all 0.1s ease-out'
                  }}
                >
                  {elemento.tipo === 'fila' ? (
                    <RowVisual 
                      element={elemento} 
                      color={area.color || '#000000'}
                      areaName={area.nombre_area}
                      onDragStart={(e) => handleMouseDown(area.id!, elemento, e)}
                    />
                  ) : (
                    <TableVisual 
                      element={elemento} 
                      color={area.color || '#000000'}
                      areaName={area.nombre_area}
                      onDragStart={(e) => handleMouseDown(area.id!, elemento, e)}
                    />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};