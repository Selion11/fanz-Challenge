import { POST as createMap } from '@/app/api/maps/route';
import { POST as createArea } from '@/app/api/maps/[id]/areas/route';
import { DELETE as deleteArea } from '@/app/api/maps/[id]/areas/[areaId]/route';
import { POST as createTable } from '@/app/api/maps/[id]/areas/[areaId]/tables/route';
import { PUT as editTable, DELETE as deleteTable } from '@/app/api/maps/[id]/areas/[areaId]/tables/[tableLabel]/route';
import { seatMapService } from '@/services/seatMapService';

const mockRequest = (method: string, body?: any) => {
  return new Request('http://localhost/api', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('E2E Testing - API de Mesas', () => {
  beforeEach(() => {
    seatMapService.clear();
  });

  const setupMapAndArea = async () => {
    const reqMap = mockRequest('POST', { nombre_plano: 'Mapa E2E Mesas' });
    const resMap = await createMap(reqMap);
    const mapId = (await resMap.json()).id;

    const reqArea = mockRequest('POST', { nombre_area: 'Área Mesas' });
    const resArea = await createArea(reqArea, { params: { id: mapId } });
    const areaId = (await resArea.json()).id;

    return { mapId, areaId };
  };

  test('Debe crear un mapa, un area y una mesa en ese area', async () => {
    const { mapId, areaId } = await setupMapAndArea();

    const reqTable = mockRequest('POST', { cantidad_sillas: 4 });
    const resTable = await createTable(reqTable, { params: { id: mapId, areaId: areaId } });
    const data = await resTable.json();

    expect(resTable.status).toBe(201);
    expect(data.etiqueta).toBe('M1');
    expect(data.cantidad_sillas).toBe(4);
  });

  test('Debe editar una mesa ya creada', async () => {
    const { mapId, areaId } = await setupMapAndArea();

    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });

    const reqEdit = mockRequest('PUT', { etiqueta: 'Mesa Principal', cantidad_sillas: 6 });
    const resEdit = await editTable(reqEdit, { params: { id: mapId, areaId, tableLabel: 'M1' } });
    const data = await resEdit.json();

    expect(resEdit.status).toBe(200);
    expect(data.etiqueta).toBe('Mesa Principal');
    expect(data.cantidad_sillas).toBe(6);
  });

  test('Debe fallar en la edicion de una mesa por intentar dejarla con nombre vacio', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });

    const reqEdit = mockRequest('PUT', { etiqueta: '   ' }); 
    const resEdit = await editTable(reqEdit, { params: { id: mapId, areaId, tableLabel: 'M1' } });

    expect(resEdit.status).toBe(400); 
  });

  test('Debe fallar en la creacion de una mesa si se mandan datos invalidos (sillas 0 o etiqueta vacía forzada)', async () => {
    const { mapId, areaId } = await setupMapAndArea();

    const reqTable = mockRequest('POST', { cantidad_sillas: 0, etiqueta: '' });
    const resTable = await createTable(reqTable, { params: { id: mapId, areaId } });

    expect(resTable.status).toBe(400);
  });

  test('Debe eliminar una mesa en un area', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });

    const reqDelete = mockRequest('DELETE');
    const resDelete = await deleteTable(reqDelete, { params: { id: mapId, areaId, tableLabel: 'M1' } });

    expect(resDelete.status).toBe(200);
  });

  test('Debe eliminar un area y corroborar que las mesas dentro ya no son accesibles', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });

    const reqDeleteArea = mockRequest('DELETE');
    const resDeleteArea = await deleteArea(reqDeleteArea, { params: { id: mapId, areaId } });
    expect(resDeleteArea.status).toBe(200);

    const reqEdit = mockRequest('PUT', { cantidad_sillas: 5 });
    const resEdit = await editTable(reqEdit, { params: { id: mapId, areaId, tableLabel: 'M1' } });
    expect(resEdit.status).toBe(404);
  });
});