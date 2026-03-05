import React, { useState } from 'react';
import { 
  Download, MapPin, DollarSign, Save, Plus, 
  Armchair, Coffee, Palette, Trash2, TrendingUp,
  ChevronDown, ChevronRight 
} from 'lucide-react';
import { SeatMap, Area, MapElement } from '@/types/map';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiService } from '@/services/api';

interface SidebarProps {
  map: SeatMap;
  onUpdateMap: (newMap: SeatMap) => void;
}

interface ElementCardProps {
  element: MapElement;
  areaColor: string;
  maxSeats: number;
  onUpdate: (updates: any) => void;
}

const ElementCard = ({ element, areaColor, maxSeats, onUpdate }: ElementCardProps) => {
  const quantity = element.tipo === 'fila' ? element.asientos?.length : element.sillas?.length;

  return (
    <div className="p-3 rounded-xl border-l-4 bg-gray-50/50 space-y-3" style={{ borderLeftColor: areaColor }}>
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
          {element.tipo} - {element.etiqueta}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
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

      {element.tipo === 'fila' && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-gray-500 uppercase">Rotación ({element.rotacion || 0}°)</label>
            <input 
              type="range" min="0" max="360" step="5" className="w-full accent-black cursor-pointer"
              value={element.rotacion || 0}
              onChange={(e) => onUpdate({ rotacion: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-gray-500 uppercase">Curvatura ({element.curvatura || 0}°)</label>
            <input 
              type="range" min="0" max="180" step="5" className="w-full accent-black cursor-pointer"
              value={element.curvatura || 0}
              onChange={(e) => onUpdate({ curvatura: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({ map, onUpdateMap }: SidebarProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({});

  const LIMITS = { fila: 20, mesa: 15, areas: 20, elementsPerArea: 50 };

  const totalRevenue = map.areas.reduce((acc, area) => {
    return acc + area.elementos.reduce((elAcc, el) => {
      const seats = el.tipo === 'fila' ? el.asientos?.length : el.sillas?.length;
      return elAcc + (el.precio * (seats || 0));
    }, 0);
  }, 0);

  const toggleArea = (id: string) => setCollapsedAreas(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(map, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${map.nombre_plano.replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const reindexElements = (elements: MapElement[]): MapElement[] => {
    let rowCount = 0; let tableCount = 0;
    return elements.map((el) => el.tipo === 'fila' 
      ? { ...el, etiqueta: `Fila ${String.fromCharCode(65 + rowCount++)}` }
      : { ...el, etiqueta: `M${++tableCount}` }
    );
  };

  const handleSave = async () => {
    if (!map.id) return alert('Error de ID');
    setIsSaving(true);
    try {
      await apiService.updateMap(map.id, map);
      alert('¡Guardado!');
    } catch (err) { alert('Error al guardar'); } finally { setIsSaving(false); }
  };

  const addElement = (areaId: string, tipo: 'fila' | 'mesa') => {
    const area = map.areas.find(a => a.id === areaId);
    if (!area || area.elementos.length >= LIMITS.elementsPerArea) return;
    const lastEl = area.elementos[area.elementos.length - 1];
    
    // FIX: Siempre inicializar la posición para evitar el error de lectura de 'x'
    const newPos = lastEl?.posicion ? { x: lastEl.posicion.x, y: lastEl.posicion.y + 80 } : { x: 50, y: 150 };

    const newElement: MapElement = tipo === 'fila' 
      ? { tipo: 'fila', etiqueta: '', precio: 0, asientos: Array.from({ length: 5 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: newPos, curvatura: 0, rotacion: 0 }
      : { tipo: 'mesa', etiqueta: '', precio: 0, sillas: Array.from({ length: 4 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: newPos };

    onUpdateMap({ ...map, areas: map.areas.map(a => a.id === areaId ? { ...a, elementos: reindexElements([...a.elementos, newElement]) } : a) });
  };

  const updateElement = (areaId: string, idx: number, updates: any) => {
    onUpdateMap({
      ...map,
      areas: map.areas.map(a => {
        if (a.id !== areaId) return a;
        let newElems = [...a.elementos];
        const target = newElems[idx];
        if (updates.cantidad !== undefined) {
          const capped = Math.min(Math.max(0, updates.cantidad), LIMITS[target.tipo]);
          const seats = Array.from({ length: capped }, (_, i) => ({ identificador: `${i + 1}` }));
          newElems[idx] = { ...target, ...(target.tipo === 'fila' ? { asientos: seats } : { sillas: seats }) } as MapElement;
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
        <Button variant="secondary" className="w-full text-white bg-white/10 hover:bg-white/20 border-none h-9 text-xs cursor-pointer" onClick={() => onUpdateMap({...map, areas: [...map.areas, {id: crypto.randomUUID(), nombre_area: 'Nueva Área', elementos: [], color: '#000'}]})}><Plus size={14} className="mr-2" /> Área</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {map.areas.map((area) => (
          <Card key={area.id} className="w-[96%] mx-auto bg-white shadow-sm border-t-4" style={{ borderTopColor: area.color }}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <button onClick={() => toggleArea(area.id!)} className="p-1 text-gray-400 cursor-pointer">{collapsedAreas[area.id!] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}</button>
                  <input className="font-bold text-sm bg-transparent outline-none w-full" value={area.nombre_area} onChange={(e) => onUpdateMap({...map, areas: map.areas.map(a => a.id === area.id ? {...a, nombre_area: e.target.value} : a)})} />
                </div>
                <input type="color" className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" value={area.color} onChange={(e) => onUpdateMap({...map, areas: map.areas.map(a => a.id === area.id ? {...a, color: e.target.value} : a)})} />
              </div>
              {!collapsedAreas[area.id!] && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => addElement(area.id!, 'fila')} className="p-2 border border-dashed rounded text-[10px] font-bold hover:bg-gray-50 cursor-pointer"><Plus size={12} /> FILA</button>
                    <button onClick={() => addElement(area.id!, 'mesa')} className="p-2 border border-dashed rounded text-[10px] font-bold hover:bg-gray-50 cursor-pointer"><Plus size={12} /> MESA</button>
                  </div>
                  <div className="space-y-3">
                    {area.elementos.map((el, idx) => <ElementCard key={idx} element={el} areaColor={area.color!} maxSeats={LIMITS[el.tipo]} onUpdate={(u) => updateElement(area.id!, idx, u)} />)}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-2">
        <Button className="w-full bg-black text-white text-xs h-10 font-bold cursor-pointer" onClick={handleSave} isLoading={isSaving}><Save size={14} className="mr-2" /> GUARDAR</Button>
        <Button 
          variant="secondary" className="w-full text-xs h-9 font-bold flex items-center justify-center" 
          onClick={handleDownloadJSON}
        >
          <Download size={14} className="mr-2" /> EXPORTAR JSON
        </Button>
      </div>
    </div>
  );
};