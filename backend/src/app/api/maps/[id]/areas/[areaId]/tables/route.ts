import { NextResponse } from 'next/server';
import { tableService } from '@/services/tableService';

interface Props {
  params: Promise<{
    id: string;
    areaId: string;
  }>;
}

export async function POST(request: Request, { params }: Props) {
  const { id, areaId } = await params;

  try {
    const body = await request.json();

    if (body.etiqueta !== undefined && String(body.etiqueta).trim() === '') {
      return NextResponse.json({ error: 'La etiqueta no puede estar vacía' }, { status: 400 });
    }

    const cantidad = body.cantidad ? parseInt(body.cantidad, 10) : 1;

    const newTables = tableService.createMultipleTables(id, areaId, {
      cantidad: cantidad,
      cantidad_sillas: body.cantidad_sillas,
      precio: body.precio
    });

    if (cantidad === 1) {
      return NextResponse.json(newTables[0], { status: 201 });
    }

    return NextResponse.json(newTables, { status: 201 });

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