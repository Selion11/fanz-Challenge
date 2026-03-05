import { NextResponse } from 'next/server';
import { areaService } from '@/services/areaService';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;

  try {
    const body = await request.json();

    const newArea = areaService.addArea(id, body);

    return NextResponse.json(newArea, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('obligatorio') || error.message.includes('encontrado')) {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al crear el área' },
      { status: 500 }
    );
  }
}