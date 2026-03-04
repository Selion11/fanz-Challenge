import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';

interface Props {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Props) {
  const { id } = params;
  const map = seatMapService.getById(id);

  if (!map) {
    return NextResponse.json(
      { error: 'Mapa no encontrado' }, 
      { status: 404 }
    );
  }

  return NextResponse.json(map);
}

export async function PUT(request: Request, { params }: Props) {
  const { id } = params;
  
  try {
    const body = await request.json();

    if (!body.nombre_plano || !Array.isArray(body.areas)) {
       return NextResponse.json(
        { error: 'Datos de mapa inválidos' }, 
        { status: 400 }
      );
    }

    const updatedMap = seatMapService.update(id, body);

    if (!updatedMap) {
      return NextResponse.json(
        { error: 'Mapa no encontrado para editar' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMap);

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al procesar la actualización' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const { id } = params;
  const success = seatMapService.delete(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Mapa no encontrado para eliminar' }, 
      { status: 404 }
    );
  }

  return NextResponse.json(
    { message: 'Mapa eliminado correctamente' }, 
    { status: 200 }
  );
}