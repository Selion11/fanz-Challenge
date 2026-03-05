import { NextResponse } from 'next/server';
import { tableService } from '@/services/tableService';

interface Props {
  params: Promise<{
    id: string;
    areaId: string;
    tableLabel: string;
  }>;
}

export async function PUT(request: Request, { params }: Props) {
  const { id, areaId, tableLabel } = await params;

  try {
    const body = await request.json();

    if (body.etiqueta !== undefined && String(body.etiqueta).trim() === '') {
      return NextResponse.json({ error: 'La etiqueta no puede estar vacía' }, { status: 400 });
    }

    const decodedLabel = decodeURIComponent(tableLabel);
    const updatedTable = tableService.updateTable(id, areaId, decodedLabel, body);

    return NextResponse.json(updatedTable);

  } catch (error: any) {
    if (error.message.includes('encontrad')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (
      error.message.includes('silla') || 
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
  const { id, areaId, tableLabel } = await params;
  
  const decodedLabel = decodeURIComponent(tableLabel);
  const success = tableService.deleteTable(id, areaId, decodedLabel);

  if (!success) {
    return NextResponse.json(
      { error: 'Mesa, área o mapa no encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { message: 'Mesa eliminada correctamente' },
    { status: 200 }
  );
}