import { NextResponse } from 'next/server';
import { seatMapService } from '@/services/seatMapService';
import { applyCors, corsOptionsHandler } from '@/lib/cors';

export const OPTIONS = corsOptionsHandler;

export async function GET() {
  return applyCors(NextResponse.json(seatMapService.getAll()));
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const newMap = seatMapService.create(body);
    
    return applyCors(NextResponse.json(newMap, { status: 201 }));
  } catch (error: any) {
    return applyCors(
      NextResponse.json({ error: error.message }, { status: 400 })
    );
  }
}