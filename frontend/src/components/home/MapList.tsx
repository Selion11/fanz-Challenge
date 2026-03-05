'use client';

import { SeatMap } from '@/types/map';
import { Card } from '@/components/ui/Card';
import { Map as MapIcon, ChevronRight, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MapListProps {
  maps: SeatMap[];
}

export const MapList = ({ maps }: MapListProps) => {
  const router = useRouter();

  if (maps.length === 0) return null;

  return (
    <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">
        Mapas Recientes
      </h3>
      <div className="grid gap-3">
        {maps.map((map) => (
          <Card 
            key={map.id} 
            className="p-4 hover:border-black transition-all cursor-pointer group flex items-center justify-between bg-white"
            onClick={() => router.push(`/maps/${map.id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                <MapIcon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{map.nombre_plano}</h4>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium uppercase mt-1">
                   <span className="flex items-center gap-1"><Layers size={10}/> {map.areas.length} Áreas</span>
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-black transition-transform group-hover:translate-x-1" />
          </Card>
        ))}
      </div>
    </div>
  );
};

import { Layers } from 'lucide-react'; // Importación necesaria para el icono interno