import { NextResponse } from 'next/server';

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

const corsHeaders = {
  'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export function applyCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const corsOptionsHandler = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
};