import { NextResponse } from 'next/server';
import { areaService } from '@/services/areaService';

interface Props {
  params: Promise<{
    id: string;      
    areaId: string; 
  }>;
}

export async function PUT(request: Request, { params }: Props) {
  const { id, areaId } = await params;

  try {
    const body = await request.json();

    const updatedArea = areaService.updateArea(id, areaId, body);

    return NextResponse.json(updatedArea);
  } catch (error: any) {
    if (error.message.includes('encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes('obligatorio') || error.message.includes('vacío')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const { id, areaId } = await params;

  const success = areaService.deleteArea(id, areaId);

  if (!success) {
    return NextResponse.json(
      { error: 'Área no encontrada o no se pudo eliminar' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { message: 'Área eliminada correctamente' },
    { status: 200 }
  );
}