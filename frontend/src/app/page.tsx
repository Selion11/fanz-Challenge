'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, Armchair, Coffee, Trash2, DollarSign, 
  Users, Plus, Upload, Map as MapIcon, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Navbar } from '@/components/layout/Navbar';
import { apiService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { SeatMap, Area, MapElement } from '@/types/map';

const MapList = ({ maps }: { maps: SeatMap[] }) => {
  const router = useRouter();
  if (maps.length === 0) return null;

  return (
    <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
        Tus mapas
      </h3>
      <div className="grid gap-3">
        {maps.map((map,index) => (
          <Card 
            key={`${map.id}-${index}`} 
            className="p-4 hover:border-black transition-all cursor-pointer group flex items-center justify-between bg-white border-gray-100 shadow-sm"
            onClick={() => router.push(`/maps/${map.id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                <MapIcon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{map.nombre_plano}</h4>
                <p className="text-[10px] text-gray-500 font-medium uppercase mt-1 flex items-center gap-1">
                  <Layers size={10}/> {map.areas.length} Áreas
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-transform group-hover:translate-x-1" />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedMaps, setSavedMaps] = useState<SeatMap[]>([]);

  const [draftMap, setDraftMap] = useState<SeatMap>({
    nombre_plano: '',
    areas: []
  });

  const LIMITS = { fila: 25, mesa: 15, areas: 20 };

  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const maps = await apiService.getAllMaps();
        setSavedMaps(maps);
      } catch (err) {
        console.error("Error al cargar mapas recientes");
      }
    };
    fetchMaps();
  }, []);

  const reindexElements = (elements: MapElement[]): MapElement[] => {
    let rowCount = 0;
    let tableCount = 0;
    return elements.map((el) => 
      el.tipo === 'fila' 
        ? { ...el, etiqueta: `Fila ${String.fromCharCode(65 + rowCount++)}` }
        : { ...el, etiqueta: `M${++tableCount}` }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importedMap = await apiService.importMap(json);
        router.push(`/maps/${importedMap.id}`);
      } catch (err: any) {
        alert('Error al procesar el JSON');
      }
    };
    reader.readAsText(file);
  };

  const addArea = () => {
    if (draftMap.areas.length >= LIMITS.areas) return alert("Límite de áreas alcanzado");
    const newArea: Area = {
      id: crypto.randomUUID(),
      nombre_area: `Área ${draftMap.areas.length + 1}`,
      elementos: [],
      color: '#000000'
    };
    setDraftMap({ ...draftMap, areas: [...draftMap.areas, newArea] });
  };

  const removeArea = (id: string) => {
    setDraftMap({ ...draftMap, areas: draftMap.areas.filter(a => a.id !== id) });
  };

  const addElement = (areaId: string, tipo: 'fila' | 'mesa') => {
    const area = draftMap.areas.find(a => a.id === areaId);
    if (!area) return;

    const countCurrentType = area.elementos.filter(el => el.tipo === tipo).length;
    if (countCurrentType >= LIMITS[tipo]) {
      return alert(`Límite de ${tipo === 'fila' ? 'filas' : 'mesas'} alcanzado en esta área`);
    }

    const newElement: MapElement = tipo === 'fila' 
      ? {
          tipo: 'fila',
          etiqueta: '',
          precio: 0,
          asientos: Array.from({ length: 5 }, (_, i) => ({ identificador: `${i + 1}` })),
          posicion: { x: 50, y: 150 + (area.elementos.length * 80) },
          curvatura: 0,
          rotacion: 0
        }
      : {
          tipo: 'mesa',
          etiqueta: '',
          precio: 0,
          sillas: Array.from({ length: 4 }, (_, i) => ({ identificador: `${i + 1}` })),
          posicion: { x: 300, y: 150 + (area.elementos.length * 80) }
        };

    const updatedElements = reindexElements([...area.elementos, newElement]);

    setDraftMap({
      ...draftMap,
      areas: draftMap.areas.map(a => a.id === areaId ? { ...a, elementos: updatedElements } : a)
    });
  };

  const updateElementDraft = (areaId: string, elIdx: number, updates: any) => {
    setDraftMap(prev => ({
      ...prev,
      areas: prev.areas.map(a => {
        if (a.id !== areaId) return a;
        const newElems = [...a.elementos];
        const target = newElems[elIdx];

        if (updates.cantidad !== undefined) {
          const qty = Math.max(1, updates.cantidad);
          const newSeats = Array.from({ length: qty }, (_, i) => ({ identificador: `${i + 1}` }));
          newElems[elIdx] = { 
            ...target, 
            ...(target.tipo === 'fila' ? { asientos: newSeats } : { sillas: newSeats }) 
          } as MapElement;
        } else {
          newElems[elIdx] = { ...target, ...updates };
        }
        return { ...a, elementos: newElems };
      })
    }));
  };

  const handleCreateFullMap = async () => {
    if (!draftMap.nombre_plano) return alert('El nombre es obligatorio');
    setLoading(true);
    try {
      const created = await apiService.createMap(draftMap); 
      router.push(`/maps/${created.id}`);
    } catch (err) {
      alert('Error al crear el mapa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-20">
      <Navbar onNewMap={() => setIsModalOpen(true)} />

      <div className="max-w-4xl mx-auto p-8 space-y-12 flex flex-col items-center pt-20">
        
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-5xl font-black tracking-tighter text-gray-900">
              SeatMapBuilder
            </h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
              Diseñá mapas de asientos profesionales de forma intuitiva. Crea desde cero o carga tus proyectos previos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              className="w-full sm:w-auto px-8 h-14 text-sm font-bold shadow-xl shadow-black/10"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} className="mr-2" /> CREAR NUEVO MAPA
            </Button>
            
            <label className="w-full sm:w-auto cursor-pointer">
              <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              <div className="flex items-center justify-center w-full sm:w-auto px-8 h-14 text-sm font-bold bg-white border-2 border-gray-200 rounded-xl hover:border-black transition-colors">
                <Upload size={18} className="mr-2" /> CARGAR JSON
              </div>
            </label>
          </div>
        </div>

        <MapList maps={savedMaps} />

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Configurar Nuevo Mapa"
          onConfirm={handleCreateFullMap}
          confirmText="Generar Mapa"
          isLoading={loading}
        >
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nombre del Plano</label>
              <input 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="Ej: Teatro Gran Rex"
                value={draftMap.nombre_plano}
                onChange={(e) => setDraftMap({...draftMap, nombre_plano: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h4 className="font-bold flex items-center gap-2 text-gray-400 uppercase text-[10px] tracking-widest">
                  <Layers size={14}/> Estructura Inicial
                </h4>
                <Button variant="secondary" onClick={addArea} className="h-7 text-[10px] font-bold">+ ÁREA</Button>
              </div>

              {draftMap.areas.map((area, aIdx) => (
                <Card key={area.id} className="p-4 bg-gray-50/50 border-2 border-gray-200 shadow-none">
                  <div className="flex justify-between items-center mb-4">
                    <input 
                      className="bg-transparent border-b border-gray-300 focus:border-black outline-none font-bold text-sm"
                      value={area.nombre_area}
                      onChange={(e) => {
                        const newAreas = [...draftMap.areas];
                        newAreas[aIdx].nombre_area = e.target.value;
                        setDraftMap({ ...draftMap, areas: newAreas });
                      }}
                    />
                    <div className="flex gap-1">
                       <Button variant="ghost" onClick={() => addElement(area.id!, 'fila')} className="h-7 text-[10px] border bg-white px-2">
                         + FILA
                       </Button>
                       <Button variant="ghost" onClick={() => addElement(area.id!, 'mesa')} className="h-7 text-[10px] border bg-white px-2">
                         + MESA
                       </Button>
                       <Button variant="ghost" onClick={() => removeArea(area.id!)} className="h-7 px-2 text-red-500">
                         <Trash2 size={14}/>
                       </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {area.elementos.map((el, eIdx) => (
                      <div key={eIdx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border shadow-sm">
                        <div className="col-span-3 flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                          {el.tipo === 'fila' ? <Armchair size={12}/> : <Coffee size={12}/>}
                          <span>{el.etiqueta}</span>
                        </div>
                        
                        <div className="col-span-4 flex items-center gap-1 border-x px-2">
                          <Users size={10} className="text-gray-400"/>
                          <input 
                            type="number" 
                            className="w-full text-[10px] outline-none"
                            value={el.tipo === 'fila' ? el.asientos?.length : el.sillas?.length}
                            onChange={(e) => updateElementDraft(area.id!, eIdx, { cantidad: parseInt(e.target.value) })}
                          />
                        </div>

                        <div className="col-span-5 flex items-center gap-1">
                          <DollarSign size={10} className="text-gray-400"/>
                          <input 
                            type="number" 
                            className="w-full text-[10px] outline-none"
                            placeholder="Precio"
                            value={el.precio}
                            onChange={(e) => updateElementDraft(area.id!, eIdx, { precio: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    ))}
                    {area.elementos.length === 0 && <p className="text-[9px] text-gray-400 italic text-center py-2">Área vacía</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    </main>
  );
}