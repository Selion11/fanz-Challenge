import React from 'react';
import { Download, MapPin, DollarSign, Save, Plus, Armchair, Coffee, Palette } from 'lucide-react';
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
  onUpdate: (updates: any) => void;
}

const ElementCard = ({ element, areaColor, onUpdate }: ElementCardProps) => {
  const quantity = element.tipo === 'fila' ? element.asientos?.length : element.sillas?.length;

  return (
    <div 
      className="p-3 rounded-xl border-l-4 bg-gray-50/50 space-y-3"
      style={{ borderLeftColor: areaColor }}
    >
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
          {element.tipo} - {element.etiqueta}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[8px] font-bold text-gray-500 uppercase">Sillas/Asientos</label>
          <input 
            type="number" 
            min="0" 
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
              type="number" 
              min="0" 
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

export const Sidebar = ({ map, onUpdateMap }: SidebarProps) => {

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(map, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${map.nombre_plano.replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const [isSaving, setIsSaving] = React.useState(false);
  
  const handleSave = async () => {
    if (!map.id) {
      alert('Error: No se pudo encontrar el identificador del mapa.');
      return;
    }

    setIsSaving(true);
    try {
      await apiService.updateMap(map.id, map);
      alert('¡Mapa guardado con éxito!');
    } catch (err) {
      alert('Error al guardar en el servidor');
    } finally {
      setIsSaving(false);
    }
  };

  const updateArea = (areaId: string, updates: Partial<Area>) => {
    onUpdateMap({
      ...map,
      areas: map.areas.map(a => a.id === areaId ? { ...a, ...updates } : a)
    });
  };

  const addElement = (areaId: string, tipo: 'fila' | 'mesa') => {
    const area = map.areas.find(a => a.id === areaId);
    if (!area) return;

    const count = area.elementos.filter(el => el.tipo === tipo).length;
    const newElement: MapElement = tipo === 'fila' 
      ? { tipo: 'fila', etiqueta: `Fila ${String.fromCharCode(65 + count)}`, precio: 0, asientos: [] }
      : { tipo: 'mesa', etiqueta: `M${count + 1}`, precio: 0, sillas: [] };

    onUpdateMap({
      ...map,
      areas: map.areas.map(a => a.id === areaId ? { ...a, elementos: [...a.elementos, newElement] } : a)
    });
  };

  const updateElement = (areaId: string, elementIdx: number, updates: any) => {
    onUpdateMap({
      ...map,
      areas: map.areas.map(a => a.id === areaId ? {
        ...a,
        elementos: a.elementos.map((el, i) => {
          if (i !== elementIdx) return el;
          const updated = { ...el, ...updates };
          
          if (updates.cantidad !== undefined) {
            const val = Math.max(0, updates.cantidad);
            if (el.tipo === 'fila') {
              updated.asientos = Array(val).fill(null).map((_, idx) => ({ identificador: `${idx + 1}` }));
            } else {
              updated.sillas = Array(val).fill(null).map((_, idx) => ({ identificador: `${idx + 1}` }));
            }
          }
          return updated as MapElement;
        })
      } : a)
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div className="p-6 bg-white border-b border-gray-100 space-y-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <MapPin size={12} /> {map.nombre_plano || 'Sin nombre'}
        </h3>
        <Button 
          variant="secondary" 
          className="w-full justify-center h-9 text-xs cursor-pointer"
          onClick={() => {
            const newId = crypto.randomUUID();
            onUpdateMap({
              ...map,
              areas: [...map.areas, { id: newId, nombre_area: 'Nueva Área', elementos: [], color: '#000000' }]
            });
          }}
        >
          <Plus size={14} className="mr-2" /> Añadir Área
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {map.areas.map((area) => (
          <Card key={area.id} className="w-[96%] mx-auto p-4 bg-white shadow-sm border-t-4" style={{ borderTopColor: area.color || '#000' }}>
            <div className="flex items-center justify-between mb-4">
              <input 
                className="font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-gray-200 w-1/2"
                value={area.nombre_area}
                onChange={(e) => updateArea(area.id, { nombre_area: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-gray-400" />
                <input 
                  type="color" 
                  className="w-6 h-6 p-0 border-none cursor-pointer bg-transparent"
                  value={area.color || '#000000'}
                  onChange={(e) => updateArea(area.id, { color: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => addElement(area.id, 'fila')}
                className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 text-[10px] font-bold hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Plus size={12} /> <Armchair size={12} /> FILA
              </button>
              <button 
                onClick={() => addElement(area.id, 'mesa')}
                className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 text-[10px] font-bold hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Plus size={12} /> <Coffee size={12} /> MESA
              </button>
            </div>

            <div className="space-y-3">
              {area.elementos.map((el, idx) => (
                <ElementCard 
                  key={idx}
                  element={el}
                  areaColor={area.color || '#000'}
                  onUpdate={(updates) => updateElement(area.id, idx, updates)}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-2">
        <Button 
          variant="secondary" 
          className="w-full justify-center text-xs font-bold cursor-pointer transition-transform active:scale-95"
          onClick={handleDownloadJSON}
        >
          <Download size={14} className="mr-2" /> EXPORTAR JSON
        </Button>
        <Button 
          className="w-full justify-center shadow-lg shadow-black/5 active:scale-95 cursor-pointer"
          onClick={handleSave}
          isLoading={isSaving}
        >
          <Save size={14} className="mr-2" /> GUARDAR EN SERVIDOR
        </Button>
      </div>
    </div>
  );
};