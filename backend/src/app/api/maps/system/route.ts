import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'reset') {
      seatMapService.clear();
      return NextResponse.json({ message: 'Sistema reseteado correctamente' });
    }

    if (action === 'import') {
      const body = await req.json();
      const importedMap = seatMapService.importMap(body);
      return NextResponse.json(importedMap, { status: 201 });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}