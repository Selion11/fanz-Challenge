import { rowService } from './rowService';
import { areaService } from './areaService';
import { seatMapService } from './seatMapService';
import { RowElement } from '@/model/types';

describe('Row Service CRUD', () => {
  let mapId: string;
  let areaId: string;
  const nombreArea = 'Platea';

  beforeEach(() => {
    seatMapService.clear();
    const map = seatMapService.create({ nombre_plano: 'Mapa Filas' });
    mapId = map.id!;
    const area = areaService.addArea(mapId, { nombre_area: nombreArea });
    areaId = area.id!;
  });

  test('Debe crear una fila con etiqueta basada en el area y asientos numerados', () => {
    const fila = rowService.addRow(mapId, areaId, { cantidad_asientos: 5 });
    
    expect(fila.tipo).toBe('fila');
    expect(fila.etiqueta).toBe('Platea 1');
    expect(fila.asientos).toHaveLength(5);
    expect(fila.asientos[0].identificador).toBe('1');
    expect(fila.asientos[4].identificador).toBe('5');
  });

  test('Debe editar una fila incrementando la cantidad de sillas', () => {
    rowService.addRow(mapId, areaId, { cantidad_asientos: 5 });
    
    const updatedFila = rowService.updateRow(mapId, areaId, 'Platea 1', { cantidad_asientos: 8 }) as RowElement;
    
    expect(updatedFila.asientos).toHaveLength(8);
    expect(updatedFila.asientos[7].identificador).toBe('8');
  });

  test('Debe editar una fila reduciendo la cantidad de sillas', () => {
    rowService.addRow(mapId, areaId, { cantidad_asientos: 10 });
    
    const updatedFila = rowService.updateRow(mapId, areaId, 'Platea 1', { cantidad_asientos: 4 }) as RowElement;
    
    expect(updatedFila.asientos).toHaveLength(4);
  });

  test('Debe eliminar una fila y redistribuir los identificadores de las restantes', () => {
    rowService.addRow(mapId, areaId, { cantidad_asientos: 5 });
    rowService.addRow(mapId, areaId, { cantidad_asientos: 5 });
    rowService.addRow(mapId, areaId, { cantidad_asientos: 5 });

    const success = rowService.deleteRow(mapId, areaId, 'Platea 2');
    expect(success).toBe(true);

    const map = seatMapService.getById(mapId);
    const elementos = map?.areas[0].elementos!;
    
    expect(elementos).toHaveLength(2);
    expect(elementos[0].etiqueta).toBe('Platea 1');
    expect(elementos[1].etiqueta).toBe('Platea 2'); 
  });

  test('Debe auto-eliminar una fila al editarla a 0 asientos y redistribuir nombres', () => {
    rowService.addRow(mapId, areaId, { cantidad_asientos: 5 });
    rowService.addRow(mapId, areaId, { cantidad_asientos: 5 }); 

    const result = rowService.updateRow(mapId, areaId, 'Platea 1', { cantidad_asientos: 0 });
    
    expect(result).toEqual({ deleted: true });

    const map = seatMapService.getById(mapId);
    const elementos = map?.areas[0].elementos!;
    
    expect(elementos).toHaveLength(1);
    expect(elementos[0].etiqueta).toBe('Platea 1'); 
  });

  test('Debe fallar si se intenta asignar más de 20 asientos al crear o editar', () => {
    expect(() => {
      rowService.addRow(mapId, areaId, { cantidad_asientos: 21 });
    }).toThrow('Una fila no puede tener más de 20 asientos');

    rowService.addRow(mapId, areaId, { cantidad_asientos: 10 });
    expect(() => {
      rowService.updateRow(mapId, areaId, 'Platea 1', { cantidad_asientos: 25 });
    }).toThrow('Una fila no puede tener más de 20 asientos');
  });

  test('Debe permitir crear múltiples filas y etiquetarlas correctamente', () => {
    const filas = rowService.createMultipleRows(mapId, areaId, { cantidad: 3, cantidad_asientos: 5 });
    
    expect(filas).toHaveLength(3);
    expect(filas[0].etiqueta).toBe('Platea 1');
    expect(filas[2].etiqueta).toBe('Platea 3');
  });

  test('Debe fallar si al crear múltiples filas se supera el límite de 15', () => {
    rowService.createMultipleRows(mapId, areaId, { cantidad: 10, cantidad_asientos: 5 });
    
    expect(() => {
      rowService.createMultipleRows(mapId, areaId, { cantidad: 6, cantidad_asientos: 5 });
    }).toThrow('límite por área es 15');
  });

  test('Debe eliminar múltiples filas y renumerar las restantes', () => {
    rowService.createMultipleRows(mapId, areaId, { cantidad: 5, cantidad_asientos: 5 });
    
    rowService.deleteMultipleRows(mapId, areaId, ['Platea 2', 'Platea 4']);
    
    const map = seatMapService.getById(mapId);
    const filas = map?.areas[0].elementos!;
    
    expect(filas).toHaveLength(3);
    expect(filas[0].etiqueta).toBe('Platea 1');
    expect(filas[1].etiqueta).toBe('Platea 2');
    expect(filas[2].etiqueta).toBe('Platea 3');
  });
});