// src/services/tableService.test.ts
import { tableService } from './tableService';
import { areaService } from './areaService';
import { seatMapService } from './seatMapService';

describe('Table Service CRUD', () => {
  let mapId: string;
  let areaId: string;

  beforeEach(() => {
    seatMapService.clear();
    const map = seatMapService.create({ nombre_plano: 'Mapa E2E Mesas' });
    mapId = map.id!;
    const area = areaService.addArea(mapId, { nombre_area: 'Área VIP' });
    areaId = area.id!;
  });

  test('Debe crear una mesa y asignarle etiqueta automática M1', () => {
    const mesa = tableService.addTable(mapId, areaId, { cantidad_sillas: 4 });
    
    expect(mesa.tipo).toBe('mesa');
    expect(mesa.etiqueta).toBe('M1');
    expect(mesa.cantidad_sillas).toBe(4);
    
    const mesa2 = tableService.addTable(mapId, areaId, { cantidad_sillas: 2 });
    expect(mesa2.etiqueta).toBe('M2');
  });

  test('Debe permitir editar una mesa cambiandole el nombre (etiqueta)', () => {
    tableService.addTable(mapId, areaId, { cantidad_sillas: 4 });
    
    const updatedMesa = tableService.updateTable(mapId, areaId, 'M1', { etiqueta: 'Mesa Principal' });
    
    expect(updatedMesa.etiqueta).toBe('Mesa Principal');
    expect(updatedMesa.cantidad_sillas).toBe(4); 
  });

  test('Debe permitir editar la cantidad de sillas de una mesa', () => {
    tableService.addTable(mapId, areaId, { cantidad_sillas: 4 }); 
    
    const updatedMesa = tableService.updateTable(mapId, areaId, 'M1', { cantidad_sillas: 8 });
    
    expect(updatedMesa.cantidad_sillas).toBe(8);
    expect(updatedMesa.etiqueta).toBe('M1');
  });

  test('Debe eliminar una mesa correctamente', () => {
    tableService.addTable(mapId, areaId, { cantidad_sillas: 4 }); 
    let map = seatMapService.getById(mapId);
    expect(map?.areas[0].elementos).toHaveLength(1);

    const success = tableService.deleteTable(mapId, areaId, 'M1');
    
    expect(success).toBe(true);
    map = seatMapService.getById(mapId);
    expect(map?.areas[0].elementos).toHaveLength(0);
  });

  test('Debe fallar al intentar crear una mesa con menos de 1 silla', () => {
    expect(() => {
      tableService.addTable(mapId, areaId, { cantidad_sillas: 0 });
    }).toThrow('La mesa debe tener al menos 1 silla');

    expect(() => {
      tableService.addTable(mapId, areaId, { cantidad_sillas: -5 });
    }).toThrow('La mesa debe tener al menos 1 silla');
  });

  test('Debe fallar al intentar crear una mesa en un mapa o área que no existe', () => {
    expect(() => {
      tableService.addTable('mapa-falso', areaId, { cantidad_sillas: 4 });
    }).toThrow('Mapa no encontrado');

    expect(() => {
      tableService.addTable(mapId, 'area-falsa', { cantidad_sillas: 4 });
    }).toThrow('Área no encontrada');
  });

  test('Debe fallar al intentar editar la cantidad de sillas a un valor menor a 1', () => {
    tableService.addTable(mapId, areaId, { cantidad_sillas: 4 }); 
    
    expect(() => {
      tableService.updateTable(mapId, areaId, 'M1', { cantidad_sillas: 0 });
    }).toThrow('La mesa debe tener al menos 1 silla');
  });

  test('Debe fallar al intentar editar una mesa que no existe', () => {
    expect(() => {
      tableService.updateTable(mapId, areaId, 'M99', { cantidad_sillas: 4 });
    }).toThrow('Mesa no encontrada');
  });
});