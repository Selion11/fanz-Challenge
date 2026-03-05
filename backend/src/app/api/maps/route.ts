import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';

export async function GET() {
  return NextResponse.json(seatMapService.getAll());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const newMap = seatMapService.create(body);
    
    return NextResponse.json(newMap, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 400 }
    );
  }
}