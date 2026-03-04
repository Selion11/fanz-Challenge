'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { SeatMap } from '@/types/map';
import { SeatMapCanvas } from '@/components/editor/SeatMapCanvas';
import { Sidebar } from '@/components/editor/Sidebar';

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

  if (loading) return <div className="p-8">Cargando editor...</div>;
  if (!map) return <div className="p-8">Mapa no encontrado.</div>;

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      <main className="flex-1 overflow-auto relative p-12 flex justify-center items-start">
         <SeatMapCanvas map={map} />
      </main>

      <aside className="w-80 bg-white border-l border-gray-200 shadow-xl z-10">
        <Sidebar map={map} onUpdateMap={handleUpdateMap} />
      </aside>
    </div>
  );
}