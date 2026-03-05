'use client';

import { useState } from 'react';
import { Layers, Armchair, Coffee, Trash2, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Navbar } from '@/components/layout/Navbar';
import { apiService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { SeatMap, Area, MapElement } from '@/types/map';

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [draftMap, setDraftMap] = useState<SeatMap>({
    nombre_plano: '',
    areas: []
  });

  const reindexElements = (elements: MapElement[]): MapElement[] => {
    let rowCount = 0;
    let tableCount = 0;
    return elements.map((el) => 
      el.tipo === 'fila' 
        ? { ...el, etiqueta: `Fila ${String.fromCharCode(65 + rowCount++)}` }
        : { ...el, etiqueta: `M${++tableCount}` }
    );
  };

  const addArea = () => {
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
    <main className="min-h-screen bg-[#f8f9fa]">
      <Navbar onNewMap={() => setIsModalOpen(true)} />

      <div className="max-w-4xl mx-auto p-8 space-y-8 flex flex-col items-center justify-center min-h-[70vh]">
        {!isModalOpen && (
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tighter text-gray-900">Bienvenido al Builder</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Seleccioná "Nuevo Mapa" para empezar a diseñar o cargá un archivo .json.
            </p>
          </div>
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Configurar Nuevo Mapa"
          onConfirm={handleCreateFullMap}
          confirmText="Generar Mapa"
          isLoading={loading}
        >
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
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
                <Card key={area.id} className="p-4 bg-gray-50/50 border-2 border-gray-200">
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
                    {area.elementos.length === 0 && <p className="text-[9px] text-gray-400 italic">Área vacía</p>}
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