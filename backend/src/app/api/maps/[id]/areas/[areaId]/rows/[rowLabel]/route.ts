import { NextResponse } from 'next/server';
import { rowService } from '@/services/rowService';

interface Props {
  params: {
    id: string;
    areaId: string;
    rowLabel: string;
  };
}

export async function PUT(request: Request, { params }: Props) {
  const { id, areaId, rowLabel } = params;

  try {
    const body = await request.json();
    
    const decodedLabel = decodeURIComponent(rowLabel);

    const updatedRow = rowService.updateRow(id, areaId, decodedLabel, body);
    
    return NextResponse.json(updatedRow);

  } catch (error: any) {
    if (error.message.includes('encontrad')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error.message.includes('asiento') || 
      error.message.includes('negativ') || 
      error.message.includes('límite') ||
      error.message.includes('cantidad')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const { id, areaId, rowLabel } = params;
  
  const decodedLabel = decodeURIComponent(rowLabel);

  const success = rowService.deleteRow(id, areaId, decodedLabel);

  if (!success) {
    return NextResponse.json(
      { error: 'Fila, área o mapa no encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { message: 'Fila eliminada correctamente' },
    { status: 200 }
  );
}