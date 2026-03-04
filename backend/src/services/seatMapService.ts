import { SeatMap } from '@/model/types';

let maps: SeatMap[] = [];

export const seatMapService = {
  getAll: (): SeatMap[] => {
    return maps;
  },

  create: (data: Partial<SeatMap>): SeatMap => {
    if (!data.nombre_plano) {
      throw new Error('El nombre del plano es obligatorio');
    }

    const newMap: SeatMap = {
      id: crypto.randomUUID(),
      nombre_plano: data.nombre_plano || 'Nuevo Mapa',
      areas: data.areas || [], 
    };
    maps.push(newMap);
    return newMap;
  },

  getById: (id: string): SeatMap | undefined => {
    return maps.find(m => m.id === id);
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

  clear: () => {
    maps = [];
  }
};