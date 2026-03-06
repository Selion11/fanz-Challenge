'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Upload, Map as MapIcon, Layers, Armchair, Coffee, Trash2, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { SeatMap, Area, MapElement } from '@/types/map';

interface NavbarProps {
  onNewMap?: () => void; 
}

export const Navbar = ({ onNewMap }: NavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftMap, setDraftMap] = useState<SeatMap>({ nombre_plano: '', areas: [] });

  const isEditing = pathname.includes('/maps/');

  const reindexElements = (elements: MapElement[]): MapElement[] => {
    let rowCount = 0; let tableCount = 0;
    return elements.map((el) => el.tipo === 'fila' 
      ? { ...el, etiqueta: `Fila ${String.fromCharCode(65 + rowCount++)}` }
      : { ...el, etiqueta: `M${++tableCount}` }
    );
  };

  const addArea = () => {
    const newArea: Area = { id: crypto.randomUUID(), nombre_area: `Área ${draftMap.areas.length + 1}`, elementos: [], color: '#000000' };
    setDraftMap({ ...draftMap, areas: [...draftMap.areas, newArea] });
  };

  const addElement = (areaId: string, tipo: 'fila' | 'mesa') => {
    const area = draftMap.areas.find(a => a.id === areaId);
    if (!area) return;
    const newElement: MapElement = tipo === 'fila' 
      ? { tipo: 'fila', etiqueta: '', precio: 0, asientos: Array.from({ length: 5 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: { x: 50, y: 150 + (area.elementos.length * 80) }, curvatura: 0, rotacion: 0 }
      : { tipo: 'mesa', etiqueta: '', precio: 0, sillas: Array.from({ length: 4 }, (_, i) => ({ identificador: `${i + 1}` })), posicion: { x: 300, y: 150 + (area.elementos.length * 80) } };
    
    setDraftMap({ ...draftMap, areas: draftMap.areas.map(a => a.id === areaId ? { ...a, elementos: reindexElements([...a.elementos, newElement]) } : a) });
  };

  const handleCreateMap = async () => {
    if (!draftMap.nombre_plano) return alert('Nombre obligatorio');
    setLoading(true);
    try {
      const created = await apiService.createMap(draftMap);
      setIsModalOpen(false);
      router.push(`/maps/${created.id}`);
    } catch (err) { alert('Error al crear'); } finally { setLoading(false); }
  };

  const handleNewMapClick = () => {
    if (isEditing) {
      if (!window.confirm('¿Perder cambios no guardados?')) return;
    }
    
    if (onNewMap) {
      onNewMap(); 
    } else {
      setDraftMap({ nombre_plano: '', areas: [] }); 
      setIsModalOpen(true); 
    }
  };

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  if (isEditing && !window.confirm('¿Cargar nuevo archivo? Perderás cambios locales.')) {
    e.target.value = ''; // Reset del input si cancela
    return;
  }

  const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const json = JSON.parse(event.target?.result as string);
        
        const imported = await apiService.importMap(json);
        
        router.push(`/maps/${imported.id}`);
        
      } catch (err) { 
        alert('Error en la importación: ' + (err instanceof Error ? err.message : 'JSON inválido')); 
      } finally { 
        setLoading(false); 
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <nav className="h-16 border-b bg-white flex items-center justify-between px-8 shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-black p-2 rounded-lg text-white group-hover:rotate-12 transition-transform">
            <MapIcon size={20} />
          </div>
          <h1 className="text-xl font-bold italic tracking-tighter">SeatMapBuilder</h1>
        </Link>

        <div className="flex items-center gap-3">
          <input type="file" id="nav-import-json" className="hidden" accept=".json" onChange={handleFileUpload} />
          <Button variant="secondary" className="text-xs font-bold" onClick={() => document.getElementById('nav-import-json')?.click()} isLoading={loading}>
            <Upload size={14} className="mr-2" /> CARGAR JSON
          </Button>
          <Button className="text-xs font-bold" onClick={handleNewMapClick}>
            <Plus size={14} className="mr-2" /> NUEVO MAPA
          </Button>
        </div>
      </nav>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Configurar Nuevo Mapa"
        onConfirm={handleCreateMap}
        confirmText="Generar Mapa"
        isLoading={loading}
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Nombre del Plano</label>
            <input className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none" placeholder="Ej: Teatro Gran Rex" value={draftMap.nombre_plano} onChange={(e) => setDraftMap({...draftMap, nombre_plano: e.target.value})} />
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Estructura</h4>
            <Button variant="secondary" onClick={addArea} className="h-7 text-[10px]">+ ÁREA</Button>
          </div>
          {draftMap.areas.map((area, aIdx) => (
            <Card key={area.id} className="p-4 bg-gray-50/50">
              <div className="flex justify-between items-center mb-4">
                <input className="bg-transparent border-b font-bold text-sm outline-none" value={area.nombre_area} onChange={(e) => {
                  const newAreas = [...draftMap.areas];
                  newAreas[aIdx].nombre_area = e.target.value;
                  setDraftMap({ ...draftMap, areas: newAreas });
                }} />
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => addElement(area.id!, 'fila')} className="h-7 text-[10px] border bg-white">+ FILA</Button>
                  <Button variant="ghost" onClick={() => addElement(area.id!, 'mesa')} className="h-7 text-[10px] border bg-white">+ MESA</Button>
                </div>
              </div>
              <div className="space-y-2">
                {area.elementos.map((el, eIdx) => (
                  <div key={eIdx} className="grid grid-cols-12 gap-2 bg-white p-2 rounded border text-[10px]">
                    <div className="col-span-4 flex items-center gap-2 font-black text-gray-400 uppercase">
                      {el.tipo === 'fila' ? <Armchair size={12}/> : <Coffee size={12}/>} {el.etiqueta}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </>
  );
};