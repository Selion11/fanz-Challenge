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
    stage?: { initialPos: ElementPosition }; // RESTAURADO: Soporte para arrastrar escenario
    offset: ElementPosition;
  } | null>(null);

  const [activeTransform, setActiveTransform] = useState<{
    type: 'rotate' | 'curve';
    elements: { areaId: string; label: string; initialRot: number; initialCurv: number }[];
    grabbedCenter: ElementPosition;
    startAngle?: number;
    startY?: number;
  } | null>(null);

  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number; } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const safeSelectedIds = selectedIds || [];
  const safeUpdateMap = onUpdateMap || (() => {});

  const defaultStage: StageConfig = map.escenario || { forma: 'rectangulo', posicion: { x: 300, y: 50 }, ancho: 400, alto: 100 };

  // RESTAURADO: Función para iniciar el arrastre del escenario
  const handleStageMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setActiveDrag({ 
      elements: [], 
      stage: { initialPos: { ...defaultStage.posicion } }, 
      offset: { x: e.clientX - rect.left, y: e.clientY - rect.top } 
    });
    onSelectionChange([]);
  };

  const handleElementMouseDown = (areaId: string, elemento: MapElement, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const elementId = `${areaId}|${elemento.etiqueta}`;
    
    let newSelection = e.shiftKey 
      ? (safeSelectedIds.includes(elementId) ? safeSelectedIds.filter(id => id !== elementId) : [...safeSelectedIds, elementId]) 
      : (safeSelectedIds.includes(elementId) ? safeSelectedIds : [elementId]);
    
    onSelectionChange(newSelection);

    const draggingElements = map.areas.flatMap(area => 
      area.elementos.filter(el => newSelection.includes(`${area.id}|${el.etiqueta}`)).map(el => ({ 
        areaId: area.id!, 
        label: el.etiqueta, 
        initialPos: { ...el.posicion } 
      }))
    );

    setActiveDrag({ elements: draggingElements, offset: { x: e.clientX - rect.left, y: e.clientY - rect.top } });
  };

  const handleTransformStart = (type: 'rotate' | 'curve', areaId: string, elemento: MapElement, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const grabbedCenter = elemento.posicion || {x: 0, y: 0};
    const startAngle = Math.atan2((e.clientY - rect.top) - grabbedCenter.y, (e.clientX - rect.left) - grabbedCenter.x) * (180 / Math.PI);
    
    const transformElements = map.areas.flatMap(area => 
      area.elementos.filter(el => safeSelectedIds.includes(`${area.id}|${el.etiqueta}`) && el.tipo === 'fila').map(el => ({ 
        areaId: area.id!, 
        label: el.etiqueta, 
        initialRot: (el as any).rotacion || 0, 
        initialCurv: (el as any).curvatura || 0 
      }))
    );
    setActiveTransform({ type, elements: transformElements, grabbedCenter, startAngle, startY: e.clientY - rect.top });
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
        // RESTAURADO: Arrastre del escenario con límites (clamping)
        newMap.escenario = { 
          ...defaultStage, 
          posicion: { 
            x: Math.max(0, Math.min(850, activeDrag.stage.initialPos.x + deltaX)), 
            y: Math.max(0, Math.min(900, activeDrag.stage.initialPos.y + deltaY)) 
          } 
        };
      } else {
        activeDrag.elements.forEach(dragged => {
          const area = newMap.areas.find(a => a.id === dragged.areaId);
          const element = area?.elementos.find(el => el.etiqueta === dragged.label);
          if (element) {
            element.posicion = { 
              x: Math.max(50, Math.min(850, dragged.initialPos.x + deltaX)), 
              y: Math.max(50, Math.min(900, dragged.initialPos.y + deltaY)) 
            };
          }
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
        activeTransform.elements.forEach(tEl => {
          const el = newMap.areas.find(a => a.id === tEl.areaId)?.elementos.find(e => e.etiqueta === tEl.label);
          if (el && el.tipo === 'fila') { el.rotacion = Math.round((tEl.initialRot + angleDelta + 360) % 360); }
        });
      } else {
        const yDelta = activeTransform.startY! - mouseY;
        activeTransform.elements.forEach(tEl => {
          const el = newMap.areas.find(a => a.id === tEl.areaId)?.elementos.find(e => e.etiqueta === tEl.label);
          if (el && el.tipo === 'fila') { el.curvatura = Math.max(0, Math.min(180, Math.round(tEl.initialCurv + yDelta))); }
        });
      }
      safeUpdateMap(newMap);
      return;
    }

    if (selectionBox) setSelectionBox(prev => prev ? { ...prev, currentX: mouseX, currentY: mouseY } : null);
  };

  const handleMouseUp = () => {
    setActiveDrag(null); setActiveTransform(null);
    if (selectionBox) {
      const left = Math.min(selectionBox.startX, selectionBox.currentX);
      const right = Math.max(selectionBox.startX, selectionBox.currentX);
      const top = Math.min(selectionBox.startY, selectionBox.currentY);
      const bottom = Math.max(selectionBox.startY, selectionBox.currentY);
      
      if (Math.abs(right - left) > 5) {
        const newSelected = [...safeSelectedIds];
        map.areas.forEach(area => area.elementos.forEach(el => {
          if (el.posicion.x >= left && el.posicion.x <= right && el.posicion.y >= top && el.posicion.y <= bottom) {
            const id = `${area.id}|${el.etiqueta}`; if (!newSelected.includes(id)) newSelected.push(id);
          }
        }));
        onSelectionChange(newSelected);
      }
      setSelectionBox(null);
    }
  };

  return (
    <div 
      ref={canvasRef} 
      className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100 p-12 min-h-[120vh] relative overflow-hidden select-none" 
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseDown={handleCanvasMouseDown}
    >
      {selectionBox && <div className="absolute border-2 border-blue-500 border-dashed z-50 pointer-events-none" style={{ left: Math.min(selectionBox.startX, selectionBox.currentX), top: Math.min(selectionBox.startY, selectionBox.currentY), width: Math.abs(selectionBox.currentX - selectionBox.startX), height: Math.abs(selectionBox.currentY - selectionBox.startY) }} />}
      
      <div className="mb-12 text-center pointer-events-none">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{map.nombre_plano || 'Sin nombre'}</h2>
        <div className="h-1 w-20 bg-black mx-auto mt-2 rounded-full" />
      </div>

      <div className="relative h-full">
        {/* ESCENARIO:onMouseDown restaurado para habilitar el arrastre */}
        <div 
          className="absolute border-2 border-dashed border-gray-300 bg-gray-50/80 flex items-center justify-center cursor-grab active:cursor-grabbing hover:border-gray-400 transition-colors shadow-sm z-0" 
          style={{ 
            left: defaultStage.posicion.x, 
            top: defaultStage.posicion.y, 
            width: defaultStage.ancho, 
            height: defaultStage.forma === 'circulo' ? defaultStage.ancho : defaultStage.alto, 
            borderRadius: defaultStage.forma === 'circulo' ? '50%' : '16px' 
          }}
          onMouseDown={handleStageMouseDown}
        >
          <span className="text-sm font-black text-gray-400 uppercase tracking-[1em] pointer-events-none">ESCENARIO</span>
        </div>

        {map.areas.map((area) => (
          <React.Fragment key={area.id}>
            {area.elementos.map((el, i) => (
              <div key={`${area.id}-${i}`} className={`absolute transition-shadow ${safeSelectedIds.includes(`${area.id}|${el.etiqueta}`) ? 'z-50' : 'z-10'}`} style={{ left: el.posicion?.x || 50, top: el.posicion?.y || 150 }}>
                {el.tipo === 'fila' ? (
                  <RowVisual 
                    element={el} color={area.color || '#000'} areaName={area.nombre_area} 
                    onDragStart={(e) => handleElementMouseDown(area.id!, el, e)} 
                    isSelected={safeSelectedIds.includes(`${area.id}|${el.etiqueta}`)} 
                    onRotateStart={(e) => handleTransformStart('rotate', area.id!, el, e)} 
                    onCurveStart={(e) => handleTransformStart('curve', area.id!, el, e)} 
                  />
                ) : (
                  <TableVisual 
                    element={el} color={area.color || '#000'} areaName={area.nombre_area} 
                    onDragStart={(e) => handleElementMouseDown(area.id!, el, e)} 
                    isSelected={safeSelectedIds.includes(`${area.id}|${el.etiqueta}`)} 
                  />
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};