import React, { useState, useRef } from 'react';
import { SeatMap, MapElement, ElementPosition, StageConfig } from '@/types/map';
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
    stage?: { initialPos: ElementPosition }; 
    offset: ElementPosition;
  } | null>(null);

  const [activeTransform, setActiveTransform] = useState<{
    type: 'rotate' | 'curve';
    elements: { areaId: string; label: string; initialRot: number; initialCurv: number }[];
    grabbedCenter: ElementPosition;
    startAngle?: number;
    startY?: number;
  } | null>(null);

  const [selectionBox, setSelectionBox] = useState<{
    startX: number; startY: number; currentX: number; currentY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const safeSelectedIds = selectedIds || [];
  const safeUpdateMap = onUpdateMap || (() => {});

  const defaultStage: StageConfig = map.escenario || {
    forma: 'rectangulo', posicion: { x: 300, y: 50 }, ancho: 400, alto: 100
  };

  const handleStageMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setActiveDrag({ elements: [], stage: { initialPos: { ...defaultStage.posicion } }, offset: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
    onSelectionChange([]);
  };

  const handleElementMouseDown = (areaId: string, elemento: MapElement, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const elementId = `${areaId}|${elemento.etiqueta}`;
    let newSelection = [...safeSelectedIds];

    if (e.shiftKey) {
      if (newSelection.includes(elementId)) newSelection = newSelection.filter(id => id !== elementId);
      else newSelection.push(elementId);
    } else {
      if (!newSelection.includes(elementId)) newSelection = [elementId];
    }
    onSelectionChange(newSelection);

    const draggingElements = map.areas.flatMap(area => 
      area.elementos.filter(el => newSelection.includes(`${area.id}|${el.etiqueta}`)).map(el => ({
        areaId: area.id!, label: el.etiqueta, initialPos: { ...(el.posicion || { x: 50, y: 150 }) }
      }))
    );

    setActiveDrag({ elements: draggingElements, offset: { x: mouseX, y: mouseY } });
  };

  const handleTransformStart = (type: 'rotate' | 'curve', areaId: string, elemento: MapElement, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const grabbedCenter = elemento.posicion || {x: 0, y: 0};
    const startAngle = Math.atan2(mouseY - grabbedCenter.y, mouseX - grabbedCenter.x) * (180 / Math.PI);

    const transformElements = map.areas.flatMap(area => 
      area.elementos.filter(el => safeSelectedIds.includes(`${area.id}|${el.etiqueta}`) && el.tipo === 'fila').map(el => ({
        areaId: area.id!, 
        label: el.etiqueta, 
        // @ts-ignore 
        initialRot: el.rotacion || 0, 
        // @ts-ignore
        initialCurv: el.curvatura || 0
      }))
    );

    setActiveTransform({ type, elements: transformElements, grabbedCenter, startAngle, startY: mouseY });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    if (e.target !== e.currentTarget && e.target !== canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setSelectionBox({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top });
    if (!e.shiftKey) onSelectionChange([]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (activeDrag) {
      const deltaX = mouseX - activeDrag.offset.x;
      const deltaY = mouseY - activeDrag.offset.y;
      const newMap = { ...map };

      if (activeDrag.stage) {
        newMap.escenario = { ...defaultStage, posicion: { x: activeDrag.stage.initialPos.x + deltaX, y: activeDrag.stage.initialPos.y + deltaY } };
      } else {
        activeDrag.elements.forEach(dragged => {
          const element = newMap.areas.find(a => a.id === dragged.areaId)?.elementos.find(el => el.etiqueta === dragged.label);
          if (element) element.posicion = { x: dragged.initialPos.x + deltaX, y: dragged.initialPos.y + deltaY };
        });
      }
      safeUpdateMap(newMap);
      return;
    }

    if (activeTransform) {
      const newMap = { ...map };

      if (activeTransform.type === 'rotate') {
        const currentAngle = Math.atan2(mouseY - activeTransform.grabbedCenter.y, mouseX - activeTransform.grabbedCenter.x) * (180 / Math.PI);
        const angleDelta = currentAngle - activeTransform.startAngle!;

        activeTransform.elements.forEach(transformEl => {
          const element = newMap.areas.find(a => a.id === transformEl.areaId)?.elementos.find(el => el.etiqueta === transformEl.label);
          if (element && element.tipo === 'fila') {
            let newRot = (transformEl.initialRot + angleDelta) % 360;
            if (newRot < 0) newRot += 360; 
            element.rotacion = Math.round(newRot);
          }
        });
      } 
      else if (activeTransform.type === 'curve') {
        const yDelta = activeTransform.startY! - mouseY; 
        
        activeTransform.elements.forEach(transformEl => {
          const element = newMap.areas.find(a => a.id === transformEl.areaId)?.elementos.find(el => el.etiqueta === transformEl.label);
          if (element && element.tipo === 'fila') {
            let newCurv = transformEl.initialCurv + yDelta;
            newCurv = Math.max(0, Math.min(180, newCurv)); 
            element.curvatura = Math.round(newCurv);
          }
        });
      }

      safeUpdateMap(newMap);
      return;
    }

    if (selectionBox) setSelectionBox(prev => prev ? { ...prev, currentX: mouseX, currentY: mouseY } : null);
  };

  const handleMouseUp = () => {
    if (activeDrag) return setActiveDrag(null);
    if (activeTransform) return setActiveTransform(null);

    if (selectionBox) {
      const left = Math.min(selectionBox.startX, selectionBox.currentX);
      const right = Math.max(selectionBox.startX, selectionBox.currentX);
      const top = Math.min(selectionBox.startY, selectionBox.currentY);
      const bottom = Math.max(selectionBox.startY, selectionBox.currentY);

      if (Math.abs(right - left) < 5 && Math.abs(bottom - top) < 5) return setSelectionBox(null);

      const newSelectedIds = [...safeSelectedIds];
      map.areas.forEach(area => {
        area.elementos.forEach(el => {
          const px = el.posicion?.x || 0; const py = el.posicion?.y || 0;
          if (px >= left && px <= right && py >= top && py <= bottom) {
            const id = `${area.id}|${el.etiqueta}`;
            if (!newSelectedIds.includes(id)) newSelectedIds.push(id);
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
      {selectionBox && (
        <div className="absolute border-2 border-blue-500 border-dashed z-50 pointer-events-none" style={{ left: Math.min(selectionBox.startX, selectionBox.currentX), top: Math.min(selectionBox.startY, selectionBox.currentY), width: Math.abs(selectionBox.currentX - selectionBox.startX), height: Math.abs(selectionBox.currentY - selectionBox.startY) }} />
      )}

      <div className="mb-12 text-center pointer-events-none">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{map.nombre_plano || 'Sin nombre'}</h2>
        <div className="h-1 w-20 bg-black mx-auto mt-2 rounded-full" />
      </div>

      <div className="relative h-full">
        <div className={`absolute border-2 border-dashed border-gray-300 bg-gray-50/80 flex items-center justify-center cursor-grab active:cursor-grabbing hover:border-gray-400 transition-colors shadow-sm z-0`} style={{ left: defaultStage.posicion.x, top: defaultStage.posicion.y, width: defaultStage.ancho, height: defaultStage.forma === 'circulo' ? defaultStage.ancho : defaultStage.alto, borderRadius: defaultStage.forma === 'circulo' ? '50%' : defaultStage.forma === 'cuadrado' ? '16px' : '16px' }} onMouseDown={handleStageMouseDown}>
          <span className="text-sm font-black text-gray-400 uppercase tracking-[1em] pointer-events-none">ESCENARIO</span>
        </div>

        {map.areas.map((area) => (
          <React.Fragment key={area.id}>
            {area.elementos.map((elemento, index) => {
              const isSelected = safeSelectedIds.includes(`${area.id}|${elemento.etiqueta}`);
              const displayPos = elemento.posicion || { x: 50, y: 150 };

              return (
                <div key={`${area.id}-${index}`} className={`absolute transition-shadow ${isSelected ? 'z-50' : 'z-10'}`} style={{ left: displayPos.x, top: displayPos.y }}>
                  {elemento.tipo === 'fila' ? (
                    <RowVisual 
                      element={elemento} color={area.color || '#000'} areaName={area.nombre_area}
                      onDragStart={(e) => handleElementMouseDown(area.id!, elemento, e)}
                      isSelected={isSelected}
                      onRotateStart={(e) => handleTransformStart('rotate', area.id!, elemento, e)}
                      onCurveStart={(e) => handleTransformStart('curve', area.id!, elemento, e)}
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