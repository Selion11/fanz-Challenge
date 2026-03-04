import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';
import { applyCors, corsOptionsHandler } from '@/lib/cors';

// Manejador para el pre-vuelo de CORS
export const OPTIONS = corsOptionsHandler;

// Definimos la interfaz para los parámetros asíncronos
interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: Props) {
  // Desvolvemos la promesa de params
  const { id } = await params; 
  const map = seatMapService.getById(id);

  if (!map) {
    return applyCors(NextResponse.json(
      { error: 'Mapa no encontrado' }, 
      { status: 404 }
    ));
  }

  return applyCors(NextResponse.json(map));
}

export async function PUT(request: Request, { params }: Props) {
  const { id } = await params;
  
  try {
    const body = await request.json();

    if (!body.nombre_plano || !Array.isArray(body.areas)) {
       return applyCors(NextResponse.json(
        { error: 'Datos de mapa inválidos' }, 
        { status: 400 }
      ));
    }

    const updatedMap = seatMapService.update(id, body);

    if (!updatedMap) {
      return applyCors(NextResponse.json(
        { error: 'Mapa no encontrado para editar' }, 
        { status: 404 }
      ));
    }

    return applyCors(NextResponse.json(updatedMap));

  } catch (error) {
    return applyCors(NextResponse.json(
      { error: 'Error al procesar la actualización' }, 
      { status: 500 }
    ));
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const { id } = await params;
  const success = seatMapService.delete(id);

  if (!success) {
    return applyCors(NextResponse.json(
      { error: 'Mapa no encontrado para eliminar' }, 
      { status: 404 }
    ));
  }

  return applyCors(NextResponse.json(
    { message: 'Mapa eliminado correctamente' }, 
    { status: 200 }
  ));
}