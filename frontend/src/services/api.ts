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
    const res = await fetch(`${API_BASE_URL}/maps/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Mapa no encontrado');
    return res.json();
  },

  importMap: async (json: any): Promise<SeatMap> => {
    const res = await fetch(`${API_BASE_URL}/maps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
    });

    if (!res.ok && (res.status === 409 || res.status === 400)) {
      const updateRes = await fetch(`${API_BASE_URL}/maps/${json.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      if (!updateRes.ok) throw new Error('Error al sobrescribir el mapa existente');
      
      return updateRes.json();
    }

    if (!res.ok) throw new Error('Error al importar el mapa');

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
    const res = await fetch(`${API_BASE_URL}/maps`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al obtener mapas');
    return res.json();
  },
};