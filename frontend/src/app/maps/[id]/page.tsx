'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { SeatMap } from '@/types/map';
import { SeatMapCanvas } from '@/components/editor/SeatMapCanvas';
import { Sidebar } from '@/components/editor/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function MapEditorPage() {
  const { id } = useParams();
  const [map, setMap] = useState<SeatMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const data = await apiService.getMapById(id as string);
        setMap(data);
      } catch (err) {
        console.error("Error cargando el mapa", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
  }, [id]);

  const handleUpdateMap = (newMap: SeatMap) => {
    setMap(newMap);
  };

  if (loading) return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center font-bold text-gray-300 italic animate-pulse">
        Sincronizando editor...
      </div>
    </div>
  );
  
  if (!map) return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-red-400 font-bold uppercase tracking-tighter">
        404 - Mapa no encontrado
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto relative p-12 flex justify-center items-start scrollbar-hide">
           <SeatMapCanvas map={map} onUpdateMap={handleUpdateMap} />
        </main>

        <aside className="w-80 bg-white border-l border-gray-200 shadow-xl z-10 flex flex-col">
          <Sidebar map={map} onUpdateMap={handleUpdateMap} />
        </aside>
      </div>
    </div>
  );
}