'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Map as MapIcon, Layers, Armchair, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/services/api';
import { SeatMap, Area, MapElement } from '@/types/map';

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [draftMap, setDraftMap] = useState<SeatMap>({
    nombre_plano: '',
    areas: []
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        setLoading(true);
        
        const importedMap = await apiService.importMap(json);
        
        router.push(`/maps/${importedMap.id}`);
        
      } catch (err: any) {
        alert('Error al procesar el JSON: ' + (err.message || 'Formato inválido'));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };


  const addArea = () => {
    const newArea: Area = {
      id: crypto.randomUUID(),
      nombre_area: `Área ${draftMap.areas.length + 1}`,
      elementos: []
    };
    setDraftMap({ ...draftMap, areas: [...draftMap.areas, newArea] });
  };

  const addElement = (areaId: string, tipo: 'fila' | 'mesa') => {
    const area = draftMap.areas.find(a => a.id === areaId);
    if (!area) return;

    const rowCount = area.elementos.filter(el => el.tipo === 'fila').length;
    const tableCount = area.elementos.filter(el => el.tipo === 'mesa').length;

    let newElement: MapElement;

    if (tipo === 'fila') {
      newElement = {
        tipo: 'fila',
        etiqueta: `Fila ${String.fromCharCode(65 + rowCount)}`,
        precio: 0,
        asientos: []
      };
    } else {
      newElement = {
        tipo: 'mesa',
        etiqueta: `M${tableCount + 1}`,
        precio: 0,
        sillas: []
      };
    }

    setDraftMap({
      ...draftMap,
      areas: draftMap.areas.map(a => 
        a.id === areaId ? { ...a, elementos: [...a.elementos, newElement] } : a
      )
    });
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
    <main className="min-h-screen bg-[#f8f9fa] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded-lg text-white">
              <MapIcon size={24} />
            </div>
            <h1 className="text-2xl font-bold italic">SeatMapBuilder</h1>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="file" 
              id="import-json" 
              className="hidden" 
              accept=".json" 
              onChange={handleFileUpload} 
            />
            
            <Button 
              variant="secondary" 
              onClick={() => document.getElementById('import-json')?.click()}
              isLoading={loading}
            >
              Cargar JSON
            </Button>
            
            <Button onClick={() => setIsModalOpen(true)}>
              Nuevo Mapa
            </Button>
          </div>
        </header>

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
              <label className="text-sm font-medium text-gray-700">Nombre del Plano</label>
              <input 
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                placeholder="Ej: Gran Rex - 2026"
                value={draftMap.nombre_plano}
                onChange={(e) => setDraftMap({...draftMap, nombre_plano: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold flex items-center gap-2"><Layers size={18}/> Áreas</h4>
                <Button variant="secondary" onClick={addArea} className="h-8 text-xs">+ Añadir Área</Button>
              </div>

              {draftMap.areas.map((area, aIdx) => (
                <Card key={area.id} className="p-4 bg-gray-50 border-dashed">
                  <div className="flex gap-2 mb-4">
                    <input 
                      className="flex-1 p-1 bg-transparent border-b border-gray-300 focus:border-black outline-none font-medium"
                      value={area.nombre_area}
                      onChange={(e) => {
                        const newAreas = [...draftMap.areas];
                        newAreas[aIdx].nombre_area = e.target.value;
                        setDraftMap({ ...draftMap, areas: newAreas });
                      }}
                    />
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Button variant="ghost" onClick={() => addElement(area.id, 'fila')} className="text-xs border">
                      + Fila
                    </Button>
                    <Button variant="ghost" onClick={() => addElement(area.id, 'mesa')} className="text-xs border">
                      + Mesa
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {area.elementos.map((el, eIdx) => (
                      <div key={eIdx} className="flex items-center gap-2 bg-white p-2 rounded border text-sm">
                        {el.tipo === 'fila' ? <Armchair size={14}/> : <Coffee size={14}/>}
                        <input 
                          className="w-16 border-b outline-none" 
                          placeholder="Etiqueta" 
                          value={el.etiqueta}
                          onChange={(e) => {
                             const newAreas = [...draftMap.areas];
                             newAreas[aIdx].elementos[eIdx].etiqueta = e.target.value;
                             setDraftMap({...draftMap, areas: newAreas});
                          }}
                        />
                          <input 
                            type="number" 
                            min="0"
                            className="w-12 border-b outline-none" 
                            placeholder="Cant." 
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setDraftMap(prev => ({
                                ...prev,
                                areas: prev.areas.map(a => a.id === area.id ? {
                                  ...a,
                                  elementos: a.elementos.map((el, i) => i === eIdx ? {
                                    ...el,
                                    ...(el.tipo === 'fila' 
                                      ? { asientos: Array(val).fill(null).map((_, idx) => ({ identificador: `${idx + 1}` })) }
                                      : { sillas: Array(val).fill(null).map((_, idx) => ({ identificador: `Silla ${idx + 1}` })) }
                                    )
                                  } : el)
                                } : a)
                              }));
                            }}
                          />

                          <span className="text-gray-400">$</span>
                          <input 
                            type="number" 
                            min="0"
                            className="w-16 border-b outline-none" 
                            value={el.precio}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setDraftMap(prev => ({
                                ...prev,
                                areas: prev.areas.map(a => a.id === area.id ? {
                                  ...a,
                                  elementos: a.elementos.map((item, i) => i === eIdx ? { ...item, precio: val } : item)
                                } : a)
                              }));
                            }}
                          />
                      </div>
                    ))}
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