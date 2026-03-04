import { seatMapService } from './seatMapService';

describe('SeatMap Service CRUD', () => {
  beforeEach(() => {
    seatMapService.clear();
  });

  test('Debe crear un nuevo mapa con nombre correctamente', () => {
    const map = seatMapService.create({ nombre_plano: 'Estadio Principal' });
    
    expect(map.id).toBeDefined();
    expect(map.nombre_plano).toBe('Estadio Principal');
    expect(map.areas).toEqual([]);
    
    const allMaps = seatMapService.getAll();
    expect(allMaps).toHaveLength(1);
  });

  test('Debe fallar al crear un mapa sin nombre', () => {
    expect(() => {
      seatMapService.create({});
    }).toThrow('El nombre del plano es obligatorio');
  });

  test('Debe permitir editar un mapa existente', () => {
    const original = seatMapService.create({ nombre_plano: 'Original' });
    const id = original.id!;

    const updatedData = { ...original, nombre_plano: 'Editado', areas: [] };
    const result = seatMapService.update(id, updatedData);

    expect(result).toBeDefined();
    expect(result?.nombre_plano).toBe('Editado');
    expect(seatMapService.getById(id)?.nombre_plano).toBe('Editado');
  });

  test('Debe permitir cambiar solo el nombre de un mapa', () => {
    const map = seatMapService.create({ nombre_plano: 'Teatro' });
    const updated = seatMapService.update(map.id!, { ...map, nombre_plano: 'Cine' });
    
    expect(updated?.nombre_plano).toBe('Cine');
  });

  test('Debe eliminar un mapa existente correctamente', () => {
    const map = seatMapService.create({ nombre_plano: 'A Borrar' });
    expect(seatMapService.getAll()).toHaveLength(1);

    const success = seatMapService.delete(map.id!);
    
    expect(success).toBe(true);
    expect(seatMapService.getAll()).toHaveLength(0);
    expect(seatMapService.getById(map.id!)).toBeUndefined();
  });

  test('Debe fallar al tratar de editar un mapa y dejarlo con nombre vacio', () => {
    const original = seatMapService.create({ nombre_plano: 'Original' });
    const id = original.id!;

    expect(() => {
      seatMapService.update(id, { ...original, nombre_plano: '' });
    }).toThrow('El nombre del plano es obligatorio');
  });
});