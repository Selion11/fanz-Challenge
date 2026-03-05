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

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}