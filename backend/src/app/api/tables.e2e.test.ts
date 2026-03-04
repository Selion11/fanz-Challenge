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
    expect(data.sillas).toHaveLength(4);
    expect(data.sillas[0].identificador).toBe('Silla 1');
  });

  test('Debe editar una mesa ya creada', async () => {
    const { mapId, areaId } = await setupMapAndArea();

    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });

    const reqEdit = mockRequest('PUT', { etiqueta: 'Mesa Principal', cantidad_sillas: 6 });
    const resEdit = await editTable(reqEdit, { params: { id: mapId, areaId, tableLabel: 'M1' } });
    const data = await resEdit.json();

    expect(resEdit.status).toBe(200);
    expect(data.etiqueta).toBe('Mesa Principal');
    expect(data.sillas).toHaveLength(6);
  });

  test('Debe fallar en la edicion de una mesa por intentar dejarla con nombre vacio', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });

    const reqEdit = mockRequest('PUT', { etiqueta: '   ' }); 
    const resEdit = await editTable(reqEdit, { params: { id: mapId, areaId, tableLabel: 'M1' } });

    expect(resEdit.status).toBe(400); 
  });

  test('Debe fallar en la creacion de una mesa si se mandan datos invalidos', async () => {
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

  test('Debe fallar al intentar crear una mesa con cantidad de sillas negativas', async () => {
    const { mapId, areaId } = await setupMapAndArea();

    const reqTable = mockRequest('POST', { cantidad_sillas: -5 });
    const resTable = await createTable(reqTable, { params: { id: mapId, areaId } });

    expect(resTable.status).toBe(400);
  });

  test('Debe fallar al intentar agregar más de 20 mesas en un área', async () => {
    const { mapId, areaId } = await setupMapAndArea();

    for (let i = 0; i < 20; i++) {
      await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });
    }

    const req21 = mockRequest('POST', { cantidad_sillas: 4 });
    const res21 = await createTable(req21, { params: { id: mapId, areaId } });

    expect(res21.status).toBe(400);
  });

  test('Debe permitir crear multiples mesas mediante batch', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    const req = mockRequest('POST', { cantidad: 3, cantidad_sillas: 4 });
    
    const res = await createTable(req, { params: { id: mapId, areaId } });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
    expect(data[0].sillas).toHaveLength(4);
  });

  test('Debe fallar al intentar crear o editar con precio negativo', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    
    const req1 = mockRequest('POST', { cantidad_sillas: 4, precio: -10 });
    const res1 = await createTable(req1, { params: { id: mapId, areaId } });
    expect(res1.status).toBe(400);

    await createTable(mockRequest('POST', { cantidad_sillas: 4, precio: 10 }), { params: { id: mapId, areaId } });
    
    const req2 = mockRequest('PUT', { precio: -5 });
    const res2 = await editTable(req2, { params: { id: mapId, areaId, tableLabel: 'M1' } });
    expect(res2.status).toBe(400);
  });
});