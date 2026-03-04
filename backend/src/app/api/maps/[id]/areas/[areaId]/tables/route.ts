import { NextResponse } from 'next/server';
import { tableService } from '@/services/tableService';

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

    if (body.etiqueta !== undefined && String(body.etiqueta).trim() === '') {
      return NextResponse.json({ error: 'La etiqueta no puede estar vacía' }, { status: 400 });
    }

    const newTable = tableService.addTable(id, areaId, body);
    return NextResponse.json(newTable, { status: 201 });

  } catch (error: any) {
    if (error.message.includes('encontrad')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes('silla')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}