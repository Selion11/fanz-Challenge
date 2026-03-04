import { TableElement, MapElement } from '@/model/types';
import { seatMapService } from './seatMapService';

export const tableService = {
  _generateLabel: (elements: MapElement[]): string => {
    const existingTables = elements.filter(e => e.tipo === 'mesa') as TableElement[];
    
    if (existingTables.length === 0) return 'M1';

    const numbers = existingTables.map(t => {
      const match = t.etiqueta.match(/^M(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    const maxNum = Math.max(0, ...numbers);
    return `M${maxNum + 1}`;
  },

  addTable: (mapId: string, areaId: string, data: { cantidad_sillas: number, precio?: number }): TableElement => {
    const map = seatMapService.getById(mapId);
    if (!map) throw new Error('Mapa no encontrado');

    const area = map.areas.find(a => a.id === areaId);
    if (!area) throw new Error('Área no encontrada');

    if (data.cantidad_sillas < 1) {
      throw new Error('La mesa debe tener al menos 1 silla');
    }

    const nextLabel = tableService._generateLabel(area.elementos);

    const newTable: TableElement = {
      tipo: 'mesa',
      etiqueta: nextLabel, 
      cantidad_sillas: data.cantidad_sillas,
      precio: data.precio || 0
    };

    area.elementos.push(newTable);
    return newTable;
  },

  updateTable: (mapId: string, areaId: string, tableLabel: string, data: { cantidad_sillas?: number, precio?: number, etiqueta?: string }): TableElement => {
    const map = seatMapService.getById(mapId);
    if (!map) throw new Error('Mapa no encontrado');

    const area = map.areas.find(a => a.id === areaId);
    if (!area) throw new Error('Área no encontrada');

    const tableIndex = area.elementos.findIndex(e => e.tipo === 'mesa' && e.etiqueta === tableLabel);
    if (tableIndex === -1) throw new Error('Mesa no encontrada');

    const existingTable = area.elementos[tableIndex] as TableElement;

    if (data.cantidad_sillas !== undefined && data.cantidad_sillas < 1) {
      throw new Error('La mesa debe tener al menos 1 silla');
    }

    const updatedTable: TableElement = {
      ...existingTable,
      etiqueta: data.etiqueta && data.etiqueta.trim() !== '' ? data.etiqueta.trim() : existingTable.etiqueta,
      cantidad_sillas: data.cantidad_sillas ?? existingTable.cantidad_sillas,
      precio: data.precio ?? existingTable.precio
    };

    area.elementos[tableIndex] = updatedTable;
    return updatedTable;
  },

  deleteTable: (mapId: string, areaId: string, tableLabel: string): boolean => {
    const map = seatMapService.getById(mapId);
    if (!map) return false;

    const area = map.areas.find(a => a.id === areaId);
    if (!area) return false;

    const initialLength = area.elementos.length;
    area.elementos = area.elementos.filter(e => !(e.tipo === 'mesa' && e.etiqueta === tableLabel));
    
    return area.elementos.length !== initialLength;
  }
};