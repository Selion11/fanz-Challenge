import { SeatMap } from '@/types/map';

const API_BASE_URL = 'http://localhost:8080/api';

export const apiService = {
  createMap: async (mapData: Partial<SeatMap>): Promise<SeatMap> => {
    const res = await fetch(`${API_BASE_URL}/maps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapData),
    });
    if (!res.ok) throw new Error('Error al crear el mapa');
    return res.json();
  },

  getMapById: async (id: string): Promise<SeatMap> => {
    const res = await fetch(`${API_BASE_URL}/maps/${id}`);
    if (!res.ok) throw new Error('Mapa no encontrado');
    return res.json();
  },

  importMap: async (mapData: any): Promise<SeatMap> => {
    const res = await fetch(`${API_BASE_URL}/maps/system?action=import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error al importar el mapa');
    }
    return res.json();
  },
  
    updateMap: async (id: string, mapData: SeatMap): Promise<SeatMap> => {
    const res = await fetch(`${API_BASE_URL}/maps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapData),
    });
    if (!res.ok) throw new Error('Error al guardar cambios');
    return res.json();
  },
  
  exportMap: async (mapData: SeatMap): Promise<Blob> => {
    const res = await fetch(`${API_BASE_URL}/maps/system?action=export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapData),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Error al exportar el mapa');
    }
    
    return res.blob();
  },

  getAllMaps: async (): Promise<SeatMap[]> => {
    const res = await fetch(`${API_BASE_URL}/maps`);
    if (!res.ok) throw new Error('Error al obtener mapas');
    return res.json();
  },
};