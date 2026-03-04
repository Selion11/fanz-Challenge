import { TableElement } from '@/model/types'; 
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

  // 1. Crear una mesa
  test('Debe crear una mesa y asignarle etiqueta automática M1 y sillas individuales', () => {
    const mesa = tableService.addTable(mapId, areaId, { cantidad_sillas: 4 });
    
    expect(mesa.tipo).toBe('mesa');
    expect(mesa.etiqueta).toBe('M1');
    expect(mesa.sillas).toHaveLength(4);
    expect(mesa.sillas[0].identificador).toBe('Silla 1');
    expect(mesa.sillas[3].identificador).toBe('Silla 4');
  });

  // 2. Editar una mesa cambiandole el nombre
  test('Debe permitir editar una mesa cambiandole el nombre (etiqueta)', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 1, cantidad_sillas: 4 });
    const updatedMesa = tableService.updateTable(mapId, areaId, 'M1', { etiqueta: 'Mesa Principal' }) as TableElement;
    
    expect(updatedMesa.etiqueta).toBe('Mesa Principal');
    expect(updatedMesa.sillas).toHaveLength(4);
  });

  // 3. Editar una mesa editando la cantidad de sillas
  test('Debe permitir editar la cantidad de sillas de una mesa', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 1, cantidad_sillas: 4 }); 
    const updatedMesa = tableService.updateTable(mapId, areaId, 'M1', { cantidad_sillas: 8 }) as TableElement;
    
    expect(updatedMesa.sillas).toHaveLength(8);
    expect(updatedMesa.sillas[7].identificador).toBe('Silla 8');
    expect(updatedMesa.etiqueta).toBe('M1'); 
  });

  // 4. Eliminar una mesa
  test('Debe eliminar una mesa correctamente', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 1, cantidad_sillas: 4 });
    let map = seatMapService.getById(mapId);
    expect(map?.areas[0].elementos).toHaveLength(1);

    const success = tableService.deleteTable(mapId, areaId, 'M1');
    
    expect(success).toBe(true);
    map = seatMapService.getById(mapId);
    expect(map?.areas[0].elementos).toHaveLength(0);
  });

  // 5. Fallar al crear una mesa con cantidad de sillas inválida
  test('Debe fallar al intentar crear una mesa con menos de 1 silla', () => {
    expect(() => {
      tableService.addTable(mapId, areaId, { cantidad_sillas: 0 });
    }).toThrow('La mesa debe tener al menos 1 silla');
  });

  // 6. Fallar al crear una mesa en un mapa o área inexistente
  test('Debe fallar al intentar crear una mesa en un mapa o área que no existe', () => {
    expect(() => {
      tableService.addTable('mapa-falso', areaId, { cantidad_sillas: 4 });
    }).toThrow('Mapa no encontrado');

    expect(() => {
      tableService.addTable(mapId, 'area-falsa', { cantidad_sillas: 4 });
    }).toThrow('Área no encontrada');
  });

  // 7. Fallar al editar una mesa dejándola con cantidad de sillas negativa
  test('Debe fallar al intentar editar la cantidad de sillas a un valor negativo', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 1, cantidad_sillas: 4 }); 
    
    expect(() => {
      tableService.updateTable(mapId, areaId, 'M1', { cantidad_sillas: -1 });
    }).toThrow('La cantidad de sillas no puede ser negativa');
  });

  // 8. Fallar al editar una mesa que no existe
  test('Debe fallar al intentar editar una mesa que no existe', () => {
    expect(() => {
      tableService.updateTable(mapId, areaId, 'M99', { cantidad_sillas: 4 });
    }).toThrow('Mesa no encontrada');
  });

  // 9. Crear múltiples mesas a la vez
  test('Debe permitir crear múltiples mesas en una sola operación', () => {
    const mesas = tableService.createMultipleTables(mapId, areaId, { cantidad: 3, cantidad_sillas: 4 });
    
    expect(mesas).toHaveLength(3);
    expect(mesas[0].sillas).toHaveLength(4);
  });

  // 10. Fallar si la creación múltiple excede el límite
  test('Debe fallar si al crear múltiples mesas se supera el límite de 20', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 18, cantidad_sillas: 2 });
    
    expect(() => {
      tableService.createMultipleTables(mapId, areaId, { cantidad: 3, cantidad_sillas: 2 });
    }).toThrow('límite por área es 20');
  });

  // 11. Eliminar múltiples mesas
  test('Debe permitir eliminar múltiples mesas a la vez y redistribuir los nombres', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 5, cantidad_sillas: 2 }); 
    
    const success = tableService.deleteMultipleTables(mapId, areaId, ['M1', 'M3', 'M5']);
    
    expect(success).toBe(true);
    const map = seatMapService.getById(mapId);
    const mesas = map?.areas[0].elementos as any[];
    
    expect(mesas).toHaveLength(2);
    expect(mesas.find(m => m.etiqueta === 'M1')).toBeDefined();
    expect(mesas.find(m => m.etiqueta === 'M2')).toBeDefined();
  });

  // 12. Eliminar una mesa editándola para que tenga 0 sillas (Y verificar redistribución)
  test('Debe auto-eliminar una mesa al editarla a 0 sillas y redistribuir nombres', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 3, cantidad_sillas: 4 });

    const result = tableService.updateTable(mapId, areaId, 'M2', { cantidad_sillas: 0 });
    
    expect(result).toEqual({ deleted: true });

    const map = seatMapService.getById(mapId);
    const mesas = map?.areas[0].elementos!;
    
    expect(mesas).toHaveLength(2);
    expect(mesas[0].etiqueta).toBe('M1'); 
    expect(mesas[1].etiqueta).toBe('M2'); 
  });

  // 13. Eliminar mesas y verificar que se renumeran
  test('Debe renumerar las mesas restantes al eliminar una o varias', () => {
    tableService.createMultipleTables(mapId, areaId, { cantidad: 3, cantidad_sillas: 4 }); 
    
    tableService.deleteTable(mapId, areaId, 'M1');
    
    const map = seatMapService.getById(mapId);
    const mesas = map?.areas[0].elementos!;
    
    expect(mesas).toHaveLength(2);
    expect(mesas[0].etiqueta).toBe('M1'); 
    expect(mesas[1].etiqueta).toBe('M2'); 
  });

  // 14. Precios no negativos
  test('Debe fallar al intentar asignar un precio negativo', () => {
    expect(() => {
      tableService.addTable(mapId, areaId, { cantidad_sillas: 4, precio: -10 });
    }).toThrow('El precio no puede ser negativo');

    tableService.addTable(mapId, areaId, { cantidad_sillas: 4, precio: 10 });
    expect(() => {
      tableService.updateTable(mapId, areaId, 'M1', { precio: -5 });
    }).toThrow('El precio no puede ser negativo');
  });
});