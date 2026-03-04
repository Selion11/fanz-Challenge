// src/app/api/maps/route.ts
import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';

function applyCors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS() {
  return applyCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  const maps = seatMapService.getAll();
  return applyCors(NextResponse.json(maps));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
        
    if (!body.nombre_plano) {
      return applyCors(
        NextResponse.json(
          { error: 'El nombre del plano es obligatorio' },
          { status: 400 }
        )
      );
    }

    const newMap = seatMapService.create(body);
    return applyCors(NextResponse.json(newMap, { status: 201 }));
    
  } catch (error) {
    return applyCors(
      NextResponse.json(
        { error: 'Error al procesar la solicitud' },
        { status: 500 }
      )
    );
  }
}