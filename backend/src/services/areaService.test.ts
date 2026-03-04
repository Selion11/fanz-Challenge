import { areaService } from './areaService';
import { seatMapService } from './seatMapService';

describe('Area Service CRUD', () => {
  let mapId: string;

  beforeEach(() => {
    seatMapService.clear();
    const map = seatMapService.create({ nombre_plano: 'Mapa Base para Áreas' });
    mapId = map.id!;
  });

  test('Debe crear un area correctamente', () => {
    const area = areaService.addArea(mapId, { nombre_area: 'Sector VIP' });
    
    expect(area.id).toBeDefined();
    expect(area.nombre_area).toBe('Sector VIP');
    expect(area.elementos).toEqual([]);

    const map = seatMapService.getById(mapId);
    expect(map?.areas).toHaveLength(1);
    expect(map?.areas[0].nombre_area).toBe('Sector VIP');
  });

  test('Debe fallar al crear un area sin nombre', () => {
    expect(() => {
      areaService.addArea(mapId, {});
    }).toThrow('El nombre del área es obligatorio');

    expect(() => {
      areaService.addArea(mapId, { nombre_area: '   ' });
    }).toThrow('El nombre del área es obligatorio');
  });

  test('Debe permitir editar el nombre de un area', () => {
    const area = areaService.addArea(mapId, { nombre_area: 'General' });
    
    const updatedArea = areaService.updateArea(mapId, area.id!, { nombre_area: 'Platea Baja' });
    
    expect(updatedArea.nombre_area).toBe('Platea Baja');
    
    const map = seatMapService.getById(mapId);
    expect(map?.areas[0].nombre_area).toBe('Platea Baja');
  });

  test('Debe fallar al intentar editar un area y dejarla con nombre vacio', () => {
    const area = areaService.addArea(mapId, { nombre_area: 'General' });
    
    expect(() => {
      areaService.updateArea(mapId, area.id!, { nombre_area: '   ' });
    }).toThrow('El nombre del área no puede estar vacío');

    expect(() => {
      areaService.updateArea(mapId, area.id!, { nombre_area: '' });
    }).toThrow('El nombre del área no puede estar vacío');
  });

  test('Debe eliminar un area correctamente', () => {
    const area = areaService.addArea(mapId, { nombre_area: 'A Borrar' });
    expect(seatMapService.getById(mapId)?.areas).toHaveLength(1);

    const success = areaService.deleteArea(mapId, area.id!);
    
    expect(success).toBe(true);
    expect(seatMapService.getById(mapId)?.areas).toHaveLength(0);
  });
});