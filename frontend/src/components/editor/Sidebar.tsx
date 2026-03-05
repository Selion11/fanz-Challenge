import React, { useState } from 'react';
import { 
  Download, MapPin, DollarSign, Save, Plus, 
  Armchair, Coffee, Palette, Trash2, TrendingUp,
  ChevronDown, ChevronRight, Circle, RectangleHorizontal
} from 'lucide-react';
import { SeatMap, Area, MapElement, StageConfig } from '@/types/map';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiService } from '@/services/api';

interface SidebarProps {
  map: SeatMap;
  onUpdateMap: (newMap: SeatMap) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

interface ElementCardProps {
  element: MapElement;
  areaColor: string;
  maxSeats: number;
  isSelected: boolean;
  onUpdate: (updates: any) => void;
  onSelect: () => void;
}

const ElementCard = ({ element, areaColor, maxSeats, isSelected, onUpdate, onSelect }: ElementCardProps) => {
  const quantity = element.tipo === 'fila' ? element.asientos?.length : element.sillas?.length;

  return (
    <div 
      className={`p-3 rounded-xl border-l-4 space-y-3 transition-all cursor-pointer ${
        isSelected ? 'bg-blue-50 border-blue-400 shadow-md' : 'bg-gray-50/50 border-transparent'
      }`}
      style={{ borderLeftColor: isSelected ? undefined : areaColor }}
      onClick={onSelect}
    >
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
          {element.tipo} - {element.etiqueta}
        </span>
        {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
      </div>
      
      <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-gray-500 uppercase">Cant. (Máx {maxSeats})</label>
          <input 
            type="number" min="0" max={maxSeats}
            className="w-full bg-white border border-gray-200 rounded p-1 text-xs outline-none focus:ring-1"
            style={{ outlineColor: areaColor }}
            value={quantity}
            onChange={(e) => onUpdate({ cantidad: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-gray-500 uppercase">Precio Unitario</label>
          <div className="relative">
            <DollarSign size={10} className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="number" min="0"
              className="w-full bg-white border border-gray-200 rounded p-1 pl-4 text-xs outline-none focus:ring-1"
              style={{ outlineColor: areaColor }}
              value={element.precio}
              onChange={(e) => onUpdate({ precio: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Sidebar = ({ map, onUpdateMap, selectedIds, onSelectionChange }: SidebarProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({});

  const LIMITS = { fila: 20, mesa: 15, areas: 20, elementsPerArea: 50 };

  const safeSelectedIds = selectedIds || [];

  const currentStage: StageConfig = map.escenario || {
    forma: 'rectangulo',
    posicion: { x: 300, y: 50 },
    ancho: 400,
    alto: 100
  };

  const totalRevenue = map.areas.reduce((acc, area) => {
    return acc + area.elementos.reduce((elAcc, el) => {
      const seats = el.tipo === 'fila' ? el.asientos?.length : el.sillas?.length;
      return elAcc + (el.precio * (seats || 0));
    }, 0);
  }, 0);

  const toggleArea = (id: string) => setCollapsedAreas(prev => ({ ...prev, [id]: !prev[id] }));

  const reindexElements = (elements: MapElement[]): MapElement[] => {
    let rowCount = 0; let tableCount = 0;
    return elements.map((el) => el.tipo === 'fila' 
      ? { ...el, etiqueta: `Fila ${String.fromCharCode(65 + rowCount++)}` }
      : { ...el, etiqueta: `M${++tableCount}` }
    );
  };

  const handleDownloadJSON = async () => {
      try {
        const blob = await apiService.exportMap(map);
        
        const url = window.URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = url;
        downloadAnchorNode.download = `${map.nombre_plano.replace(/\s+/g, '_')}_export.json`;
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        
        window.URL.revokeObjectURL(url);
        downloadAnchorNode.remove();
      } catch (err) {
        alert('Hubo un problema al exportar el mapa. Revisá la consola.');
        console.error(err);
      }
    };

  const handleSave = async () => {
    if (!map.id) return alert('Error de ID');
    setIsSaving(true);
    try {
      await apiService.updateMap(map.id, map);
      alert('¡Mapa guardado con éxito!');
    } catch (err) { alert('Error al guardar'); } finally { setIsSaving(false); }
  };

  const deleteSelectedElements = () => {
    const count = safeSelectedIds.length;
    if (count === 0) return;

    if (window.confirm(`¿Estás seguro de que querés borrar los ${count} elementos seleccionados?`)) {
      const newMap = { ...map };
      newMap.areas = newMap.areas.map(area => ({
        ...area,
        elementos: area.elementos.filter(el => !safeSelectedIds.includes(`${area.id}|${el.etiqueta}`))
      }));
      onUpdateMap(newMap);
      onSelectionChange([]);
    }
  };

  const updateStage = (updates: Partial<StageConfig>) => {
    onUpdateMap({
      ...map,
      escenario: { ...currentStage, ...updates }
    });
  };

  const updateArea = (areaId: string, updates: Partial<Area>) => {
    onUpdateMap({ ...map, areas: map.areas.map(a => a.id === areaId ? { ...a, ...updates } : a) });
  };

  const removeArea = (areaId: string) => {
    if (confirm('¿Estás seguro de que querés eliminar esta área y todos sus elementos?')) {
      onUpdateMap({ ...map, areas: map.areas.filter(a => a.id !== areaId) });
    }
  };

  const addElement = (areaId: string, tipo: 'fila' | 'mesa') => {
    const area = map.areas.find(a => a.id === areaId);
    if (!area || area.elementos.length >= LIMITS.elementsPerArea) return;
    const lastEl = area.elementos[area.elementos.length - 1];
    const newPos = lastEl?.posicion ? { x: lastEl.posicion.x, y: lastEl.posicion.y + 80 } : { x: 50, y: 150 };

    const newElement: MapElement = tipo === 'fila' 
      ? { tipo: 'fila', etiqueta: '', precio: 0, asientos: Array.from({ length: 5 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: newPos, curvatura: 0, rotacion: 0 }
      : { tipo: 'mesa', etiqueta: '', precio: 0, sillas: Array.from({ length: 4 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: newPos };

    onUpdateMap({ ...map, areas: map.areas.map(a => a.id === areaId ? { ...a, elementos: reindexElements([...a.elementos, newElement]) } : a) });
  };

  const updateElement = (areaId: string, idx: number, updates: any) => {
    const area = map.areas.find(a => a.id === areaId);
    const targetEl = area?.elementos[idx];

    if (updates.cantidad === 0) {
      if (!window.confirm(`¿Estás seguro de que querés borrar ${targetEl?.tipo === 'fila' ? 'la fila' : 'la mesa'} ${targetEl?.etiqueta}?`)) return;
    }

    onUpdateMap({
      ...map,
      areas: map.areas.map(a => {
        if (a.id !== areaId) return a;
        let newElems = [...a.elementos];
        const target = newElems[idx];
        if (updates.cantidad !== undefined) {
          if (updates.cantidad <= 0) {
            newElems.splice(idx, 1);
          } else {
            const capped = Math.min(Math.max(0, updates.cantidad), LIMITS[target.tipo]);
            const seats = Array.from({ length: capped }, (_, i) => ({ identificador: `${i + 1}` }));
            newElems[idx] = { ...target, ...(target.tipo === 'fila' ? { asientos: seats } : { sillas: seats }) } as MapElement;
          }
        } else {
          newElems[idx] = { ...target, ...updates } as MapElement;
        }
        return { ...a, elementos: reindexElements(newElems) };
      })
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div className="p-6 bg-gradient-to-br from-gray-900 to-black text-white space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> {map.nombre_plano}</h3>
          <TrendingUp size={16} className="text-green-400" />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-gray-400 uppercase">Recaudación Potencial</p>
          <p className="text-2xl font-black">${totalRevenue.toLocaleString()}</p>
        </div>
        <Button variant="secondary" className="w-full text-white bg-white/10 hover:bg-white/20 border-none h-9 text-xs cursor-pointer" onClick={() => onUpdateMap({...map, areas: [...map.areas, {id: crypto.randomUUID(), nombre_area: 'Nueva Área', elementos: [], color: '#000000'}]})}><Plus size={14} className="mr-2" /> Área</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        <Card className="w-[96%] mx-auto bg-white shadow-sm border-t-4 border-gray-800 overflow-hidden mb-2">
          <div className="p-4 space-y-4">
            <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-2">
               Escenario
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
               <button 
                  onClick={() => updateStage({forma: 'rectangulo'})} 
                  className={`flex flex-col items-center justify-center p-2 text-[9px] font-bold border rounded transition-colors ${currentStage.forma === 'rectangulo' ? 'bg-black text-white border-black' : 'hover:bg-gray-50 text-gray-500'}`}
               >
                 <RectangleHorizontal size={14} className="mb-1" /> RECTÁNGULO
               </button>
               <button 
                  onClick={() => updateStage({forma: 'circulo'})} 
                  className={`flex flex-col items-center justify-center p-2 text-[9px] font-bold border rounded transition-colors ${currentStage.forma === 'circulo' ? 'bg-black text-white border-black' : 'hover:bg-gray-50 text-gray-500'}`}
               >
                 <Circle size={14} className="mb-1" /> CÍRCULO
               </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-gray-500 uppercase">Ancho ({currentStage.ancho}px)</label>
                <input 
                  type="range" min="100" max="800" step="10" 
                  value={currentStage.ancho} 
                  onChange={(e) => updateStage({ancho: parseInt(e.target.value)})} 
                  className="w-full accent-black cursor-pointer" 
                />
              </div>
              
              <div className={`space-y-1 transition-opacity ${currentStage.forma === 'circulo' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <label className="text-[8px] font-bold text-gray-500 uppercase">Alto ({currentStage.alto}px)</label>
                <input 
                  type="range" min="50" max="600" step="10" 
                  value={currentStage.alto} 
                  onChange={(e) => updateStage({alto: parseInt(e.target.value)})} 
                  className="w-full accent-black cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </Card>

        {map.areas.map((area) => {
          const isCollapsed = collapsedAreas[area.id!];

          return (
            <Card key={area.id} className="w-[96%] mx-auto bg-white shadow-sm border-t-4 overflow-hidden" style={{ borderTopColor: area.color }}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <button onClick={() => toggleArea(area.id!)} className="p-1 text-gray-400 cursor-pointer">{isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}</button>
                    <input className="font-bold text-sm bg-transparent outline-none w-full border-b border-transparent focus:border-gray-100" value={area.nombre_area} onChange={(e) => updateArea(area.id!, { nombre_area: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => removeArea(area.id!)} className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer transition-colors"><Trash2 size={14} /></button>
                    <input type="color" className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" value={area.color} onChange={(e) => updateArea(area.id!, { color: e.target.value })} />
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => addElement(area.id!, 'fila')} className="p-2 border border-dashed rounded text-[10px] font-bold hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-1"><Plus size={12} /> FILA</button>
                      <button onClick={() => addElement(area.id!, 'mesa')} className="p-2 border border-dashed rounded text-[10px] font-bold hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-1"><Plus size={12} /> MESA</button>
                    </div>
                    <div className="space-y-3">
                      {area.elementos.map((el, idx) => (
                        <ElementCard 
                          key={idx} 
                          element={el} 
                          areaColor={area.color!} 
                          maxSeats={LIMITS[el.tipo]} 
                          isSelected={safeSelectedIds.includes(`${area.id}|${el.etiqueta}`)}
                          onUpdate={(u) => updateElement(area.id!, idx, u)}
                          onSelect={() => {
                            const id = `${area.id}|${el.etiqueta}`;
                            onSelectionChange(safeSelectedIds.includes(id) ? safeSelectedIds.filter(i => i !== id) : [...safeSelectedIds, id]);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-2">
        {safeSelectedIds.length > 0 && (
          <Button variant="danger" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10 mb-2 flex items-center justify-center" onClick={deleteSelectedElements}>
            <Trash2 size={16} className="mr-2" /> BORRAR SELECCIONADOS ({safeSelectedIds.length})
          </Button>
        )}
        <Button className="w-full bg-black hover:bg-gray-800 text-white text-xs h-10 font-bold flex items-center justify-center" onClick={handleSave} isLoading={isSaving}>
          <Save size={14} className="mr-2" /> GUARDAR EN SERVIDOR
        </Button>
        <Button variant="secondary" className="w-full text-xs h-9 font-bold flex items-center justify-center" onClick={handleDownloadJSON}>
          <Download size={14} className="mr-2" /> EXPORTAR JSON
        </Button>
      </div>
    </div>
  );
};