import { POST as createMap } from '@/app/api/route';
import { GET as getMap } from '@/app/api/maps/[id]/route';
import { POST as createArea } from '@/app/api/maps/[id]/areas/route';
import { POST as createTable } from '@/app/api/maps/[id]/areas/[areaId]/tables/route';
import { POST as createRow } from '@/app/api/maps/[id]/areas/[areaId]/rows/route';
import { PUT as editRow, DELETE as deleteRow } from '@/app/api/maps/[id]/areas/[areaId]/rows/[rowLabel]/route';
import { seatMapService } from '@/services/seatMapService';

const mockRequest = (method: string, body?: any) => {
  return new Request('http://localhost/api', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('E2E Testing - API de Filas', () => {
  beforeEach(() => {
    seatMapService.clear();
  });

  const setupMapAndArea = async () => {
    const reqMap = mockRequest('POST', { nombre_plano: 'Mapa E2E Filas' });
    const resMap = await createMap(reqMap);
    const mapId = (await resMap.json()).id;

    const reqArea = mockRequest('POST', { nombre_area: 'Sector Mixto' });
    const resArea = await createArea(reqArea, { params: { id: mapId } });
    const areaId = (await resArea.json()).id;

    return { mapId, areaId };
  };

  test('Debe crear un mapa, un area y agregarle mesas y filas', async () => {
    const { mapId, areaId } = await setupMapAndArea();

    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });
    const resRow = await createRow(mockRequest('POST', { cantidad_asientos: 10 }), { params: { id: mapId, areaId } });

    expect(resRow.status).toBe(201);
    const data = await resRow.json();
    expect(data.tipo).toBe('fila');
    expect(data.etiqueta).toBe('Sector Mixto 1');
  });

  test('Debe crear una fila en un area que tiene mesas', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });

    const resRow = await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } });
    expect(resRow.status).toBe(201);
    const data = await resRow.json();
    expect(data.etiqueta).toBe('Sector Mixto 1');
  });

  test('Debe editar una fila en un area con mesas', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createTable(mockRequest('POST', { cantidad_sillas: 4 }), { params: { id: mapId, areaId } });
    await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } }); 

    const resEdit = await editRow(mockRequest('PUT', { cantidad_asientos: 8 }), { params: { id: mapId, areaId, rowLabel: 'Sector Mixto 1' } });
    expect(resEdit.status).toBe(200);
    const data = await resEdit.json();
    expect(data.asientos).toHaveLength(8);
  });

  test('Debe eliminar una fila (de varias) en un area y ver que se renombre de manera correcta', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } }); 
    await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } });
    await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } });

    const resDelete = await deleteRow(mockRequest('DELETE'), { params: { id: mapId, areaId, rowLabel: 'Sector Mixto 2' } });
    expect(resDelete.status).toBe(200);

    const resGet = await getMap(mockRequest('GET'), { params: { id: mapId } });
    const mapData = await resGet.json();
    const elementos = mapData.areas[0].elementos;

    expect(elementos).toHaveLength(2);
    expect(elementos[0].etiqueta).toBe('Sector Mixto 1');
    expect(elementos[1].etiqueta).toBe('Sector Mixto 2');
  });

  test('Debe eliminar una fila editandola para que tenga 0 asientos', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } }); 

    const resEdit = await editRow(mockRequest('PUT', { cantidad_asientos: 0 }), { params: { id: mapId, areaId, rowLabel: 'Sector Mixto 1' } });
    expect(resEdit.status).toBe(200);
    const data = await resEdit.json();
    expect(data.deleted).toBe(true);
  });

  test('Debe fallar al intentar crear una fila en un area con asientos negativos', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    const resRow = await createRow(mockRequest('POST', { cantidad_asientos: -3 }), { params: { id: mapId, areaId } });
    expect(resRow.status).toBe(400);
  });

  test('Debe fallar al intentar crear una fila con mas de 20 asientos', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    const resRow = await createRow(mockRequest('POST', { cantidad_asientos: 25 }), { params: { id: mapId, areaId } });
    expect(resRow.status).toBe(400);
  });

  test('Debe fallar al tratar de asignarle mas de 15 filas a un area', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    
    for(let i=0; i<15; i++) {
        await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } });
    }

    const resRow16 = await createRow(mockRequest('POST', { cantidad_asientos: 5 }), { params: { id: mapId, areaId } });
    expect(resRow16.status).toBe(400);
  });

  test('Debe permitir crear multiples filas mediante batch', async () => {
    const { mapId, areaId } = await setupMapAndArea();
    const req = mockRequest('POST', { cantidad: 3, cantidad_asientos: 5 });
    
    const res = await createRow(req, { params: { id: mapId, areaId } });
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
  });
});