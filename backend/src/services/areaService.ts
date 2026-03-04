import { Area } from '@/model/types';
import { seatMapService } from './seatMapService';

export const areaService = {
  addArea: (mapId: string, areaData: Partial<Area>): Area => {
    const map = seatMapService.getById(mapId);
    if (!map) {
      throw new Error('Mapa no encontrado');
    }
    
    if (!areaData.nombre_area || String(areaData.nombre_area).trim() === '') {
      throw new Error('El nombre del área es obligatorio');
    }

    const newArea: Area = {
      id: crypto.randomUUID(),
      nombre_area: areaData.nombre_area.trim(),
      elementos: areaData.elementos || []
    };
    
    map.areas.push(newArea);
    return newArea;
  },

  updateArea: (mapId: string, areaId: string, areaData: Partial<Area>): Area => {
    const map = seatMapService.getById(mapId);
    if (!map) {
      throw new Error('Mapa no encontrado');
    }

    if (areaData.nombre_area !== undefined && String(areaData.nombre_area).trim() === '') {
      throw new Error('El nombre del área no puede estar vacío');
    }

    const areaIndex = map.areas.findIndex(a => a.id === areaId);
    if (areaIndex === -1) {
      throw new Error('Área no encontrada');
    }

    const updatedName = areaData.nombre_area 
      ? areaData.nombre_area.trim() 
      : map.areas[areaIndex].nombre_area;

    map.areas[areaIndex] = { 
      ...map.areas[areaIndex], 
      ...areaData, 
      nombre_area: updatedName,
      id: areaId 
    };
    
    return map.areas[areaIndex];
  },

  deleteArea: (mapId: string, areaId: string): boolean => {
    const map = seatMapService.getById(mapId);
    if (!map) return false;

    const initialLength = map.areas.length;
    map.areas = map.areas.filter(a => a.id !== areaId);
    return map.areas.length !== initialLength;
  }
};