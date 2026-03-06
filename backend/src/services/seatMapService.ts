import { SeatMap } from '@/model/types';
import { randomUUID } from 'crypto';

let maps: SeatMap[] = [];

export const seatMapService = {

  getAll: (): SeatMap[] => {
    return maps;
  },

  getById: (id: string): SeatMap | undefined => {
    return maps.find(m => m.id === id);
  },

  create: (data: Partial<SeatMap>): SeatMap => {
    if (!data.nombre_plano) {
      throw new Error('El nombre del plano es obligatorio');
    }

    const newMap: SeatMap = {
      id: randomUUID(),
      nombre_plano: data.nombre_plano,
      areas: data.areas || [],
      escenario: data.escenario 
    };
    maps.push(newMap);
    return newMap;
  },

  update: (id: string, data: SeatMap): SeatMap | null => {
    if (!data.nombre_plano) {
      throw new Error('El nombre del plano es obligatorio');
    }

    const index = maps.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    maps[index] = { ...data, id }; 
    return maps[index];
  },

  delete: (id: string): boolean => {
    const initialLength = maps.length;
    maps = maps.filter(m => m.id !== id);
    return maps.length !== initialLength;
  },

  importMap: (fullMap: SeatMap): SeatMap => {
    if (!fullMap.nombre_plano || !Array.isArray(fullMap.areas)) {
      throw new Error('Estructura de mapa inválida');
    }

    const existingIndex = maps.findIndex(m => m.id === fullMap.id);

    const mapToPersist: SeatMap = {
      ...fullMap,
      id: fullMap.id || randomUUID()
    };

    if (existingIndex !== -1) {
      maps[existingIndex] = mapToPersist;
    } else {
      maps.push(mapToPersist);
    }

    return mapToPersist;
  },

  clear: (): void => {
    maps = [];
  }
};