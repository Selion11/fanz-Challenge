import React, { useState, useRef } from 'react';
import { SeatMap, MapElement, ElementPosition } from '@/types/map';
import { RowVisual } from './RowElement';
import { TableVisual } from './TableElement';

interface SeatMapCanvasProps {
  map: SeatMap;
  onUpdateMap: (newMap: SeatMap) => void;
  selectedIds: string[]; 
  onSelectionChange: (ids: string[]) => void;
}

export const SeatMapCanvas = ({ map, onUpdateMap, selectedIds, onSelectionChange }: SeatMapCanvasProps) => {
  const [activeDrag, setActiveDrag] = useState<{
    elements: { areaId: string; label: string; initialPos: ElementPosition }[];
    offset: ElementPosition;
  } | null>(null);

  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const safeSelectedIds = selectedIds || [];
  const safeUpdateMap = onUpdateMap || (() => {});

  const handleElementMouseDown = (areaId: string, elemento: MapElement, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const elementId = `${areaId}|${elemento.etiqueta}`;
    let newSelection = [...safeSelectedIds];

    if (e.shiftKey) {
      if (newSelection.includes(elementId)) {
        newSelection = newSelection.filter(id => id !== elementId);
      } else {
        newSelection.push(elementId);
      }
    } else {
      if (!newSelection.includes(elementId)) {
        newSelection = [elementId];
      }
    }
    onSelectionChange(newSelection);

    const draggingElements = map.areas.flatMap(area => 
      area.elementos
        .filter(el => newSelection.includes(`${area.id}|${el.etiqueta}`))
        .map(el => ({
          areaId: area.id!,
          label: el.etiqueta,
          initialPos: { ...(el.posicion || { x: 50, y: 150 }) }
        }))
    );

    setActiveDrag({
      elements: draggingElements,
      offset: { x: mouseX, y: mouseY }
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    if (e.target !== e.currentTarget && e.target !== canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionBox({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    });
    
    if (!e.shiftKey) {
      onSelectionChange([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeDrag) {
      const deltaX = x - activeDrag.offset.x;
      const deltaY = y - activeDrag.offset.y;

      const newMap = { ...map };
      activeDrag.elements.forEach(dragged => {
        const area = newMap.areas.find(a => a.id === dragged.areaId);
        const element = area?.elementos.find(el => el.etiqueta === dragged.label);
        if (element) {
          element.posicion = {
            x: dragged.initialPos.x + deltaX,
            y: dragged.initialPos.y + deltaY
          };
        }
      });
      safeUpdateMap(newMap);
      return;
    }

    if (selectionBox) {
      setSelectionBox(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
    }
  };

  const handleMouseUp = () => {
    if (activeDrag) {
      setActiveDrag(null);
      return;
    }

    if (selectionBox) {
      const left = Math.min(selectionBox.startX, selectionBox.currentX);
      const right = Math.max(selectionBox.startX, selectionBox.currentX);
      const top = Math.min(selectionBox.startY, selectionBox.currentY);
      const bottom = Math.max(selectionBox.startY, selectionBox.currentY);

      if (Math.abs(right - left) < 5 && Math.abs(bottom - top) < 5) {
        setSelectionBox(null);
        return;
      }

      const newSelectedIds = [...safeSelectedIds];

      map.areas.forEach(area => {
        area.elementos.forEach(el => {
          const px = el.posicion?.x || 0;
          const py = el.posicion?.y || 0;
          
          if (px >= left && px <= right && py >= top && py <= bottom) {
            const id = `${area.id}|${el.etiqueta}`;
            if (!newSelectedIds.includes(id)) {
              newSelectedIds.push(id);
            }
          }
        });
      });

      onSelectionChange(newSelectedIds);
      setSelectionBox(null);
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100 p-12 min-h-[120vh] relative overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Caja visual de selección: Solo reborde punteado */}
      {selectionBox && (
        <div 
          className="absolute border-2 border-blue-500 border-dashed z-50 pointer-events-none"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY),
          }}
        />
      )}

      <div className="mb-12 text-center pointer-events-none">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {map.nombre_plano || 'Sin nombre'}
        </h2>
        <div className="h-1 w-20 bg-black mx-auto mt-2 rounded-full" />
      </div>

      <div className="relative h-full">
        {/* Escenario */}
        <div className="mb-32 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50 pointer-events-none">
          <span className="text-sm font-black text-gray-300 uppercase tracking-[1em]">ESCENARIO</span>
        </div>

        {map.areas.map((area) => (
          <React.Fragment key={area.id}>
            {area.elementos.map((elemento, index) => {
              const isSelected = safeSelectedIds.includes(`${area.id}|${elemento.etiqueta}`);
              const displayPos = elemento.posicion || { x: 50, y: 150 };

              return (
                <div 
                  key={`${area.id}-${index}`}
                  className={`absolute transition-shadow ${isSelected ? 'z-50' : 'z-10'}`}
                  style={{ left: displayPos.x, top: displayPos.y }}
                >
                  {elemento.tipo === 'fila' ? (
                    <RowVisual 
                      element={elemento} color={area.color || '#000'} areaName={area.nombre_area}
                      onDragStart={(e) => handleElementMouseDown(area.id!, elemento, e)}
                      isSelected={isSelected}
                    />
                  ) : (
                    <TableVisual 
                      element={elemento} color={area.color || '#000'} areaName={area.nombre_area}
                      onDragStart={(e) => handleElementMouseDown(area.id!, elemento, e)}
                      isSelected={isSelected}
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