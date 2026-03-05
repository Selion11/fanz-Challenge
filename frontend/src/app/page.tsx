'use client';

import { useState } from 'react';
import { Layers, Armchair, Coffee } from 'lucide-react';
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

  const addArea = () => {
    const newArea: Area = {
      id: crypto.randomUUID(),
      nombre_area: `Área ${draftMap.areas.length + 1}`,
      elementos: [],
      color: '#000000'
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
        asientos: [{ identificador: '1' }],
        posicion: { x: 50, y: 150 + (rowCount * 50) },
        curvatura: 0,
        rotacion: 0
      };
    } else {
      newElement = {
        tipo: 'mesa',
        etiqueta: `M${tableCount + 1}`,
        precio: 0,
        sillas: [{ identificador: '1' }],
        posicion: { x: 300, y: 150 + (tableCount * 50) }
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
    <main className="min-h-screen bg-[#f8f9fa]">
      <Navbar onNewMap={() => setIsModalOpen(true)} />

      <div className="max-w-4xl mx-auto p-8 space-y-8 flex flex-col items-center justify-center min-h-[70vh]">
        {!isModalOpen && (
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tighter text-gray-900 animate-in fade-in slide-in-from-bottom-2">Bienvenido al Builder</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Seleccioná "Nuevo Mapa" para empezar a diseñar desde cero o cargá un archivo .json existente.
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
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 uppercase text-[10px] font-bold tracking-widest">Nombre del Plano</label>
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
                <Card key={area.id} className="p-4 bg-gray-50/50 border-dashed border-2 border-gray-200">
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
                       <Button variant="ghost" onClick={() => addElement(area.id!, 'fila')} className="h-7 text-[10px] border bg-white px-2 hover:bg-gray-100">
                         + FILA
                       </Button>
                       <Button variant="ghost" onClick={() => addElement(area.id!, 'mesa')} className="h-7 text-[10px] border bg-white px-2 hover:bg-gray-100">
                         + MESA
                       </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {area.elementos.map((el, eIdx) => (
                      <div key={eIdx} className="flex items-center gap-2 bg-white px-2 py-1 rounded border text-[9px] font-black text-gray-400 uppercase">
                        {el.tipo === 'fila' ? <Armchair size={10}/> : <Coffee size={10}/>}
                        <span>{el.etiqueta}</span>
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