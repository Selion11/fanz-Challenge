// src/components/layout/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Upload, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/services/api';

interface NavbarProps {
  onNewMap?: () => void; // Si se pasa, abre el modal. Si no, redirige a home.
}

export const Navbar = ({ onNewMap }: NavbarProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const json = JSON.parse(event.target?.result as string);
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

  const handleNewMapAction = () => {
    if (onNewMap) {
      onNewMap();
    } else {
      router.push('/');
    }
  };

  return (
    <nav className="h-16 border-b bg-white flex items-center justify-between px-8 shadow-sm">
      {/* Click en el nombre redirecciona a Home */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="bg-black p-2 rounded-lg text-white group-hover:rotate-12 transition-transform">
          <MapIcon size={20} />
        </div>
        <h1 className="text-xl font-bold italic tracking-tighter">SeatMapBuilder</h1>
      </Link>

      <div className="flex items-center gap-3">
        <input 
          type="file" 
          id="nav-import-json" 
          className="hidden" 
          accept=".json" 
          onChange={handleFileUpload} 
        />
        
        <Button 
          variant="secondary" 
          className="text-xs font-bold"
          onClick={() => document.getElementById('nav-import-json')?.click()}
          isLoading={loading}
        >
          <Upload size={14} className="mr-2" /> CARGAR JSON
        </Button>
        
        <Button 
          className="text-xs font-bold"
          onClick={handleNewMapAction}
        >
          <Plus size={14} className="mr-2" /> NUEVO MAPA
        </Button>
      </div>
    </nav>
  );
};