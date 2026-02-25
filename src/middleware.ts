import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT = 150;
const WINDOW = 60 * 1000;
const ipRequests = new Map<string, { count: number; startTime: number }>();

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // const forwarded = request.headers.get('x-forwarded-for');
  // const ip = forwarded
  //   ? forwarded.split(',')[0].trim()
  //   : 'unknown';

  // const now = Date.now();

  // const record = ipRequests.get(ip);

  // if (!record) {
  //   ipRequests.set(ip, { count: 1, startTime: now });
  // } else {
  //   if (now - record.startTime > WINDOW) {
  //     ipRequests.set(ip, { count: 1, startTime: now });
  //   } else {
  //     if (record.count >= RATE_LIMIT) {
  //       return new NextResponse(
  //         JSON.stringify({ error: 'Too many requests, please try again later.' }),
  //         {
  //           status: 429,
  //           headers: { 'Content-Type': 'application/json' },
  //         }
  //       );
  //     }
  //     record.count += 1;
  //     ipRequests.set(ip, record);
  //   }
  // }

  // if (url.pathname.startsWith('/api')) {
  //   const origin = request.headers.get('origin');
  //   const authKey = request.headers.get('x-api-key');

  //   const allowedOrigin = process.env.NEXT_PUBLIC_CLIENT_URL;
  //   const expectedApiKey = process.env.PRIVATE_API_KEY;

  //   if (origin !== allowedOrigin || authKey !== expectedApiKey) {
  //     return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
  //       status: 401,
  //       headers: { 'Content-Type': 'application/json' },
  //     });
  //   }
  // }

  if (url.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const currentUser = JSON.parse(jsonPayload);

      if (!currentUser || currentUser.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (err) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
