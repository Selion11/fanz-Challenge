import { NextResponse } from 'next/server';

export function applyCors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export function corsOptionsHandler() {
  return applyCors(new NextResponse(null, { status: 204 }));
}