import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';
import { SeatMap } from '@/model/types';
interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params; 
  const map = seatMapService.getById(id);

  if (!map) {
    return NextResponse.json(
      { error: 'Mapa no encontrado en la memoria' }, 
      { status: 404 }
    );
  }

  return NextResponse.json(map);
}

export async function PUT(request: Request, { params }: Props) {
  const { id } = await params;
  
  try {
    const body: SeatMap = await request.json();

    if (!body.nombre_plano || !Array.isArray(body.areas)) {
       return NextResponse.json(
        { error: 'Datos de mapa inválidos o estructura corrupta' }, 
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
    console.error("Error en PUT /api/maps/[id]:", error);
    return NextResponse.json(
      { error: 'Error interno al procesar la actualización del mapa' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const { id } = await params;
  const success = seatMapService.delete(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Mapa no encontrado para eliminar' }, 
      { status: 404 }
    );
  }

  return NextResponse.json(
    { message: 'Mapa eliminado correctamente de la memoria' }, 
    { status: 200 }
  );
}