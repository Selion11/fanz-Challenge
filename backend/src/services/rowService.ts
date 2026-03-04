import { RowElement, Seat, Area } from '@/model/types';
import { seatMapService } from './seatMapService';

export const rowService = {
  _recalculateRowLabels: (area: Area): void => {
    let rowCounter = 1;
    area.elementos.forEach(elemento => {
      if (elemento.tipo === 'fila') {
        elemento.etiqueta = `${area.nombre_area} ${rowCounter}`;
        rowCounter++;
      }
    });
  },

  _generateSeats: (cantidad: number): Seat[] => {
    return Array.from({ length: cantidad }, (_, i) => ({
      identificador: String(i + 1)
    }));
  },

  addRow: (mapId: string, areaId: string, data: { cantidad_asientos: number, precio?: number }): RowElement => {
     const rows = rowService.createMultipleRows(mapId, areaId, { ...data, cantidad: 1 });
     return rows[0];
  },

  createMultipleRows: (mapId: string, areaId: string, data: { cantidad: number, cantidad_asientos: number, precio?: number }): RowElement[] => {
    const map = seatMapService.getById(mapId);
    if (!map) throw new Error('Mapa no encontrado');

    const area = map.areas.find(a => a.id === areaId);
    if (!area) throw new Error('Área no encontrada');

    if (data.precio !== undefined && data.precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    if (data.cantidad < 1) throw new Error('La cantidad a crear debe ser al menos 1');
    
    if (data.cantidad_asientos < 1) throw new Error('La fila debe tener al menos 1 asiento al crearse');
    if (data.cantidad_asientos > 20) throw new Error('Una fila no puede tener más de 20 asientos');

    const filasExistentes = area.elementos.filter(e => e.tipo === 'fila').length;
    
    if (filasExistentes + data.cantidad > 15) {
      throw new Error(`No se pueden crear ${data.cantidad} filas. El límite por área es 15 y ya hay ${filasExistentes}.`);
    }

    const createdRows: RowElement[] = [];

    for (let i = 0; i < data.cantidad; i++) {
        const newRow: RowElement = {
            tipo: 'fila',
            etiqueta: '', 
            precio: data.precio || 0,
            asientos: rowService._generateSeats(data.cantidad_asientos)
        };
        area.elementos.push(newRow);
        createdRows.push(newRow);
    }
    
    rowService._recalculateRowLabels(area);

    return createdRows;
  },

  updateRow: (mapId: string, areaId: string, rowLabel: string, data: { cantidad_asientos?: number, precio?: number }): RowElement | { deleted: true } => {
    const map = seatMapService.getById(mapId);
    if (!map) throw new Error('Mapa no encontrado');

    const area = map.areas.find(a => a.id === areaId);
    if (!area) throw new Error('Área no encontrada');

    if (data.precio !== undefined && data.precio < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    const rowIndex = area.elementos.findIndex(e => e.tipo === 'fila' && e.etiqueta === rowLabel);
    if (rowIndex === -1) throw new Error('Fila no encontrada');

    if (data.cantidad_asientos === 0) {
      area.elementos.splice(rowIndex, 1); 
      rowService._recalculateRowLabels(area);
      return { deleted: true };
    }

    const existingRow = area.elementos[rowIndex] as RowElement;

    if (data.cantidad_asientos !== undefined && data.cantidad_asientos < 0) {
        throw new Error('La cantidad de asientos no puede ser negativa');
    }

    if (data.cantidad_asientos !== undefined && data.cantidad_asientos > 20) {
      throw new Error('Una fila no puede tener más de 20 asientos');
    }

    let nuevosAsientos = existingRow.asientos;
    if (data.cantidad_asientos !== undefined && data.cantidad_asientos !== existingRow.asientos.length) {
        nuevosAsientos = rowService._generateSeats(data.cantidad_asientos);
    }

    const updatedRow: RowElement = {
      ...existingRow,
      precio: data.precio ?? existingRow.precio,
      asientos: nuevosAsientos
    };

    area.elementos[rowIndex] = updatedRow;
    return updatedRow;
  },

  deleteRow: (mapId: string, areaId: string, rowLabel: string): boolean => {
    return rowService.deleteMultipleRows(mapId, areaId, [rowLabel]);
  },

  deleteMultipleRows: (mapId: string, areaId: string, rowLabels: string[]): boolean => {
    const map = seatMapService.getById(mapId);
    if (!map) return false;

    const area = map.areas.find(a => a.id === areaId);
    if (!area) return false;

    const initialLength = area.elementos.length;
    
    area.elementos = area.elementos.filter(e => {
        if (e.tipo === 'fila' && rowLabels.includes(e.etiqueta)) {
            return false;
        }
        return true;
    });
    
    if (area.elementos.length !== initialLength) {
      rowService._recalculateRowLabels(area);
      return true;
    }

    return false;
  }
};