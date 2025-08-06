import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  if (url.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const authKey = request.headers.get('x-api-key');

    const allowedOrigin = process.env.NEXT_PUBLIC_CLIENT_URL;
    const expectedApiKey = process.env.PRIVATE_API_KEY;

    if (origin !== allowedOrigin || authKey !== expectedApiKey) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return NextResponse.next();
}
