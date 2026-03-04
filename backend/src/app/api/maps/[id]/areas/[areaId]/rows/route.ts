import { NextResponse } from 'next/server';
import { rowService } from '@/services/rowService';

interface Props {
  params: {
    id: string;
    areaId: string;
  };
}

export async function POST(request: Request, { params }: Props) {
  const { id, areaId } = params;

  try {
    const body = await request.json();

    const cantidad = body.cantidad ? parseInt(body.cantidad, 10) : 1;

    const newRows = rowService.createMultipleRows(id, areaId, {
      cantidad: cantidad,
      cantidad_asientos: body.cantidad_asientos,
      precio: body.precio
    });

    if (cantidad === 1) {
      return NextResponse.json(newRows[0], { status: 201 });
    }

    return NextResponse.json(newRows, { status: 201 });

  } catch (error: any) {
    if (error.message.includes('encontrad')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error.message.includes('asiento') || 
      error.message.includes('límite') || 
      error.message.includes('cantidad') || 
      error.message.includes('negativ')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}