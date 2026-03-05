import React from 'react';
import { 
  Download, MapPin, DollarSign, Save, Plus, 
  Armchair, Coffee, Palette, Trash2, TrendingUp 
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
          <label className="text-[8px] font-bold text-gray-500 uppercase">Cant. (Máx {maxSeats})</label>
          <input 
            type="number" 
            min="0" 
            max={maxSeats}
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
  const [isSaving, setIsSaving] = React.useState(false);

  const LIMITS = {
    fila: 20,
    mesa: 15,
    areas: 20,
    elementsPerArea: 50
  };

  // Cálculo de Recaudación Total
  const totalRevenue = map.areas.reduce((acc, area) => {
    return acc + area.elementos.reduce((elAcc, el) => {
      const seats = el.tipo === 'fila' ? el.asientos?.length : el.sillas?.length;
      return elAcc + (el.precio * (seats || 0));
    }, 0);
  }, 0);

  const reindexElements = (elements: MapElement[]): MapElement[] => {
    let rowCount = 0;
    let tableCount = 0;
    return elements.map((el) => {
      if (el.tipo === 'fila') {
        return { ...el, etiqueta: `Fila ${String.fromCharCode(65 + rowCount++)}` };
      } else {
        return { ...el, etiqueta: `M${++tableCount}` };
      }
    });
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(map, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${map.nombre_plano.replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
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

  const removeArea = (areaId: string) => {
    if (confirm('¿Estás seguro de que querés eliminar esta área y todos sus elementos?')) {
      onUpdateMap({
        ...map,
        areas: map.areas.filter(a => a.id !== areaId)
      });
    }
  };

  const addArea = () => {
    if (map.areas.length >= LIMITS.areas) return alert(`Límite de ${LIMITS.areas} áreas alcanzado`);
    onUpdateMap({
      ...map,
      areas: [...map.areas, { id: crypto.randomUUID(), nombre_area: `Nueva Área ${map.areas.length + 1}`, elementos: [], color: '#000000' }]
    });
  };

  const addElement = (areaId: string, tipo: 'fila' | 'mesa') => {
    const area = map.areas.find(a => a.id === areaId);
    if (!area || area.elementos.length >= LIMITS.elementsPerArea) return alert("Límite alcanzado");

    const lastElement = area.elementos[area.elementos.length - 1];
    
    // FIX: Garantizamos que la posición exista siempre para evitar el crash del Canvas
    const newPos = lastElement?.posicion 
      ? { x: lastElement.posicion.x, y: lastElement.posicion.y + 80 } 
      : { x: 50, y: 150 };

    const newElement: MapElement = tipo === 'fila' 
      ? { tipo: 'fila', etiqueta: '', precio: 0, asientos: Array.from({ length: 5 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: newPos }
      : { tipo: 'mesa', etiqueta: '', precio: 0, sillas: Array.from({ length: 4 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: newPos };

    onUpdateMap({
      ...map,
      areas: map.areas.map(a => a.id === areaId ? { ...a, elementos: reindexElements([...a.elementos, newElement]) } : a)
    });
  };

  const updateElement = (areaId: string, elementIdx: number, updates: any) => {
    onUpdateMap({
      ...map,
      areas: map.areas.map(a => {
        if (a.id !== areaId) return a;
        let newElems = [...a.elementos];
        const target = newElems[elementIdx];

        if (updates.cantidad !== undefined) {
          if (updates.cantidad <= 0) {
            newElems.splice(elementIdx, 1);
          } else {
            const capped = Math.min(updates.cantidad, LIMITS[target.tipo]);
            const updated = { ...target, ...updates };
            const seats = Array.from({ length: capped }, (_, i) => ({ identificador: `${i + 1}` }));
            target.tipo === 'fila' ? (updated as any).asientos = seats : (updated as any).sillas = seats;
            newElems[elementIdx] = updated as MapElement;
          }
        } else {
          // Mantenemos la posición actual si solo cambia el precio u otra prop
          newElems[elementIdx] = { ...target, ...updates } as MapElement;
        }
        return { ...a, elementos: reindexElements(newElems) };
      })
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Resumen de Recaudación */}
      <div className="p-6 bg-gradient-to-br from-gray-900 to-black text-white space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={12} className="text-white" /> {map.nombre_plano || 'Sin nombre'}
          </h3>
          <TrendingUp size={16} className="text-green-400" />
        </div>
        
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-gray-400 uppercase">Potencial de Venta</p>
          <p className="text-2xl font-black tracking-tighter">
            ${totalRevenue.toLocaleString('es-AR')}
          </p>
        </div>

        <Button 
          variant="secondary" 
          className="w-full justify-center h-9 text-xs font-bold bg-white/10 hover:bg-white/20 border-none text-white cursor-pointer" 
          onClick={addArea}
        >
          <Plus size={14} className="mr-2" /> Añadir Área
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {map.areas.map((area) => (
          <Card key={area.id} className="w-[96%] mx-auto p-4 bg-white shadow-sm border-t-4 overflow-hidden" style={{ borderTopColor: area.color || '#000' }}>
            <div className="flex items-center justify-between mb-4">
              <input 
                className="font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-gray-100 w-1/2" 
                value={area.nombre_area} 
                onChange={(e) => updateArea(area.id!, { nombre_area: e.target.value })} 
              />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => removeArea(area.id!)}
                  className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                  title="Eliminar Área"
                >
                  <Trash2 size={14} />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <Palette size={14} className="text-gray-400" />
                <input 
                  type="color" 
                  className="w-6 h-6 p-0 border-none cursor-pointer bg-transparent" 
                  value={area.color || '#000000'} 
                  onChange={(e) => updateArea(area.id!, { color: e.target.value })} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => addElement(area.id!, 'fila')} 
                className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 text-[10px] font-bold hover:bg-gray-50 cursor-pointer text-gray-600 active:scale-95 transition-transform"
              >
                <Plus size={12} /><Armchair size={12} /> FILA
              </button>
              <button 
                onClick={() => addElement(area.id!, 'mesa')} 
                className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 text-[10px] font-bold hover:bg-gray-50 cursor-pointer text-gray-600 active:scale-95 transition-transform"
              >
                <Plus size={12} /><Coffee size={12} /> MESA
              </button>
            </div>

            <div className="space-y-3">
              {area.elementos.map((el, idx) => (
                <ElementCard 
                  key={idx} 
                  element={el} 
                  areaColor={area.color || '#000'} 
                  maxSeats={LIMITS[el.tipo]} 
                  onUpdate={(u) => updateElement(area.id!, idx, u)} 
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 space-y-2">
        <Button variant="secondary" className="w-full justify-center text-xs font-bold cursor-pointer transition-transform active:scale-95" onClick={handleDownloadJSON}>
          <Download size={14} className="mr-2" /> EXPORTAR JSON
        </Button>
        <Button className="w-full justify-center text-xs font-bold cursor-pointer shadow-lg active:scale-95 bg-black hover:bg-gray-800" onClick={handleSave} isLoading={isSaving}>
          <Save size={14} className="mr-2" /> GUARDAR EN SERVIDOR
        </Button>
      </div>
    </div>
  );
};