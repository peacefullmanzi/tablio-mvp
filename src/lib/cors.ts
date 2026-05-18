import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'https://temfy.vercel.app',
];

export function corsResponse(
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.join(', '),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      ...headers,
    },
  });
}

export function handleCors(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    return corsResponse({}, 204);
  }
  return null;
}