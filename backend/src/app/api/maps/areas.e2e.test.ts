import { POST as createMap } from '@/app/api/maps/route';
import { GET as getMap, DELETE as deleteMap } from '@/app/api/maps/[id]/route';
import { POST as createArea } from '@/app/api/maps/[id]/areas/route';
import { PUT as editArea, DELETE as deleteArea } from '@/app/api/maps/[id]/areas/[areaId]/route';
import { seatMapService } from '@/services/seatMapService';

const mockRequest = (method: string, body?: any) => {
  return new Request('http://localhost/api', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('E2E Testing - API de Áreas', () => {
  beforeEach(() => {
    seatMapService.clear();
  });

  const setupMap = async () => {
    const req = mockRequest('POST', { nombre_plano: 'Mapa E2E' });
    const res = await createMap(req);
    const data = await res.json();
    return data.id;
  };

  test('Debe crear un area en un mapa ya existente', async () => {
    const mapId = await setupMap();
    
    const req = mockRequest('POST', { nombre_area: 'Platea Alta' });
    const res = await createArea(req, { params: { id: mapId } });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.nombre_area).toBe('Platea Alta');
    expect(data.id).toBeDefined();
  });

  test('Debe editar un area dentro de un mapa', async () => {
    const mapId = await setupMap();
    
    const reqCreate = mockRequest('POST', { nombre_area: 'VIP' });
    const resCreate = await createArea(reqCreate, { params: { id: mapId } });
    const areaData = await resCreate.json();
    const areaId = areaData.id;

    const reqEdit = mockRequest('PUT', { nombre_area: 'Super VIP' });
    const resEdit = await editArea(reqEdit, { params: { id: mapId, areaId: areaId } });
    const updatedData = await resEdit.json();

    expect(resEdit.status).toBe(200);
    expect(updatedData.nombre_area).toBe('Super VIP');
  });

  test('Debe fallar al intentar crear un area en un mapa inexistente', async () => {
    const req = mockRequest('POST', { nombre_area: 'Sector Fantasma' });
    const res = await createArea(req, { params: { id: 'mapa-falso-123' } });
    const data = await res.json();

    expect(res.status).toBe(400); 
    expect(data.error).toBe('Mapa no encontrado');
  });

  test('Al borrar un mapa, el mapa y sus áreas dejan de existir', async () => {
    const mapId = await setupMap();
    
    await createArea(mockRequest('POST', { nombre_area: 'Area 1' }), { params: { id: mapId } });

    const reqDelete = mockRequest('DELETE');
    const resDelete = await deleteMap(reqDelete, { params: { id: mapId } });
    expect(resDelete.status).toBe(200);

    const reqGet = mockRequest('GET');
    const resGet = await getMap(reqGet, { params: { id: mapId } });
    expect(resGet.status).toBe(404);
  });

  test('Debe permitir crear varias areas para un solo mapa', async () => {
    const mapId = await setupMap();
    
    await createArea(mockRequest('POST', { nombre_area: 'Norte' }), { params: { id: mapId } });
    await createArea(mockRequest('POST', { nombre_area: 'Sur' }), { params: { id: mapId } });
    await createArea(mockRequest('POST', { nombre_area: 'Este' }), { params: { id: mapId } });

    const reqGet = mockRequest('GET');
    const resGet = await getMap(reqGet, { params: { id: mapId } });
    const mapData = await resGet.json();

    expect(resGet.status).toBe(200);
    expect(mapData.areas).toHaveLength(3);
    expect(mapData.areas[0].nombre_area).toBe('Norte');
    expect(mapData.areas[2].nombre_area).toBe('Este');
  });

  test('Debe eliminar un area especifica de un mapa', async () => {
    const mapId = await setupMap();
    
    const reqCreate = mockRequest('POST', { nombre_area: 'A Borrar' });
    const resCreate = await createArea(reqCreate, { params: { id: mapId } });
    const areaId = (await resCreate.json()).id;

    const reqDelete = mockRequest('DELETE');
    const resDelete = await deleteArea(reqDelete, { params: { id: mapId, areaId: areaId } });
    expect(resDelete.status).toBe(200);

    const reqGet = mockRequest('GET');
    const resGet = await getMap(reqGet, { params: { id: mapId } });
    const mapData = await resGet.json();
    
    expect(mapData.areas).toHaveLength(0);
  });
});