import { TableElement, Area, Seat, ElementPosition, MapElement } from '@/model/types';
import { seatMapService } from './seatMapService';

export const tableService = {
  _recalculateTableLabels: (area: Area): void => {
    let tableCounter = 1;
    area.elementos.forEach(elemento => {
      if (elemento.tipo === 'mesa') {
        elemento.etiqueta = `M${tableCounter}`;
        tableCounter++;
      }
    });
  },

  _generateTableSeats: (cantidad: number): Seat[] => {
    return Array.from({ length: cantidad }, (_, i) => ({
      identificador: `Silla ${i + 1}`
    }));
  },

  _calculateNextPosition: (elementos: MapElement[]): ElementPosition => {
    if (elementos.length === 0) return { x: 50, y: 50 };
    const maxY = Math.max(...elementos.map(el => el.posicion.y));
    return { x: 50, y: maxY + 80 }; 
  },

  addTable: (mapId: string, areaId: string, data: { cantidad_sillas: number, precio?: number }): TableElement => {
    const tables = tableService.createMultipleTables(mapId, areaId, { ...data, cantidad: 1 });
    return tables[0];
  },

  createMultipleTables: (mapId: string, areaId: string, data: { cantidad: number, cantidad_sillas: number, precio?: number }): TableElement[] => {
    const map = seatMapService.getById(mapId);
    if (!map) throw new Error('Mapa no encontrado');

    const area = map.areas.find(a => a.id === areaId);
    if (!area) throw new Error('Área no encontrada');

    if (data.precio !== undefined && data.precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    if (data.cantidad < 1) throw new Error('La cantidad a crear debe ser al menos 1');
    if (data.cantidad_sillas < 1) throw new Error('La mesa debe tener al menos 1 silla');

    const mesasExistentes = area.elementos.filter(e => e.tipo === 'mesa').length;
    if (mesasExistentes + data.cantidad > 20) {
      throw new Error(`No se pueden crear ${data.cantidad} mesas. El límite por área es 20 y ya hay ${mesasExistentes}.`);
    }

    const createdTables: TableElement[] = [];
    let currentY = tableService._calculateNextPosition(area.elementos).y;

    for (let i = 0; i < data.cantidad; i++) {
      const newTable: TableElement = {
        tipo: 'mesa',
        etiqueta: '', 
        sillas: tableService._generateTableSeats(data.cantidad_sillas),
        precio: data.precio || 0,
        posicion: { x: 50, y: currentY } 
      };

      area.elementos.push(newTable);
      createdTables.push(newTable);
      currentY += 80; 
    }

    tableService._recalculateTableLabels(area);
    return createdTables;
  },

  updateTable: (mapId: string, areaId: string, tableLabel: string, data: { cantidad_sillas?: number, precio?: number, etiqueta?: string, posicion?: ElementPosition }): TableElement | { deleted: true } => {
    const map = seatMapService.getById(mapId);
    if (!map) throw new Error('Mapa no encontrado');

    const area = map.areas.find(a => a.id === areaId);
    if (!area) throw new Error('Área no encontrada');

    if (data.precio !== undefined && data.precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    const tableIndex = area.elementos.findIndex(e => e.tipo === 'mesa' && e.etiqueta === tableLabel);
    if (tableIndex === -1) throw new Error('Mesa no encontrada');

    if (data.cantidad_sillas === 0) {
      area.elementos.splice(tableIndex, 1); 
      tableService._recalculateTableLabels(area); 
      return { deleted: true };
    }

    const existingTable = area.elementos[tableIndex] as TableElement;

    if (data.cantidad_sillas !== undefined && data.cantidad_sillas < 0) {
      throw new Error('La cantidad de sillas no puede ser negativa');
    }

    let nuevasSillas = existingTable.sillas;
    // CORRECCIÓN: Usamos existingTable en lugar de existingRow
    if (data.cantidad_sillas !== undefined && data.cantidad_sillas !== existingTable.sillas.length) {
        nuevasSillas = tableService._generateTableSeats(data.cantidad_sillas);
    }

    const updatedTable: TableElement = {
      ...existingTable,
      etiqueta: data.etiqueta && data.etiqueta.trim() !== '' ? data.etiqueta.trim() : existingTable.etiqueta,
      sillas: nuevasSillas, 
      precio: data.precio ?? existingTable.precio,
      posicion: data.posicion ?? existingTable.posicion
    };

    area.elementos[tableIndex] = updatedTable;
    return updatedTable;
  },

  deleteTable: (mapId: string, areaId: string, tableLabel: string): boolean => {
    return tableService.deleteMultipleTables(mapId, areaId, [tableLabel]);
  },

  deleteMultipleTables: (mapId: string, areaId: string, tableLabels: string[]): boolean => {
    const map = seatMapService.getById(mapId);
    if (!map) return false;

    const area = map.areas.find(a => a.id === areaId);
    if (!area) return false;

    const initialLength = area.elementos.length;
    
    area.elementos = area.elementos.filter(e => {
        if (e.tipo === 'mesa' && tableLabels.includes(e.etiqueta)) {
            return false; 
        }
        return true; 
    });
    
    if (area.elementos.length !== initialLength) {
      tableService._recalculateTableLabels(area);
      return true;
    }

    return false;
  }
};