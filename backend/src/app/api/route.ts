import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';

export async function GET() {
  const maps = seatMapService.getAll();
  return NextResponse.json(maps);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
        
    if (!body.nombre_plano) {
      return NextResponse.json(
        { error: 'El nombre del plano es obligatorio' },
        { status: 400 }
      );
    }

    const newMap = seatMapService.create(body);
    
    return NextResponse.json(newMap, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}