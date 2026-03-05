import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'reset') {
      seatMapService.clear();
      return NextResponse.json({ message: 'Sistema reseteado' });
    }

    if (action === 'import') {
      const body = await req.json();
      return NextResponse.json(seatMapService.importMap(body), { status: 201 });
    }

    if (action === 'export') {
      const mapData = await req.json();
      const fileName = `${mapData.nombre_plano?.replace(/\s+/g, '_') || 'mapa'}_export.json`;

      return new NextResponse(JSON.stringify(mapData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}