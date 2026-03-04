import { POST as systemAction } from '@/app/api/maps/system/route';
import { GET as getMap } from '@/app/api/maps/[id]/route';
import { seatMapService } from '@/services/seatMapService';

const mockRequest = (method: string, action: string, body?: any) => {
  return new Request(`http://localhost/api/maps/system?action=${action}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('E2E Testing - Import/Export/Reset', () => {
  beforeEach(() => {
    seatMapService.clear();
  });

  test('Debe resetear el sistema (Nuevo Mapa)', async () => {
    seatMapService.create({ nombre_plano: 'Mapa a borrar' });
    expect(seatMapService.getAll()).toHaveLength(1);

    const req = mockRequest('POST', 'reset');
    await systemAction(req);

    expect(seatMapService.getAll()).toHaveLength(0);
  });

  test('Debe importar un JSON completo y permitir recuperarlo', async () => {
    const fakeMap = {
      nombre_plano: 'Mapa Importado',
      areas: [{
        id: 'area-1',
        nombre_area: 'VIP',
        elementos: [
          { tipo: 'mesa', etiqueta: 'M1', precio: 100, sillas: [{ identificador: 'Silla 1' }] }
        ]
      }]
    };

    const reqImport = mockRequest('POST', 'import', fakeMap);
    const resImport = await systemAction(reqImport);
    const dataImport = await resImport.json();

    expect(resImport.status).toBe(201);
    expect(dataImport.id).toBeDefined();

    // Validar "Exportar" (con el GET existente)
    const resGet = await getMap(new Request('http://l'), { params: { id: dataImport.id } });
    const dataGet = await resGet.json();
    
    expect(dataGet.nombre_plano).toBe('Mapa Importado');
    expect(dataGet.areas[0].elementos[0].etiqueta).toBe('M1');
  });
});