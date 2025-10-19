import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT = 10; // tối đa 10 request
const WINDOW = 60 * 1000; // trong 1 phút
const ipRequests = new Map<string, { count: number; startTime: number }>();

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // 🔹 Lấy IP người dùng (fix lỗi .trim)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : 'unknown';

  const now = Date.now();

  // 🔸 1. Chặn spam / flood request theo IP
  const record = ipRequests.get(ip);

  if (!record) {
    ipRequests.set(ip, { count: 1, startTime: now });
  } else {
    // Nếu đã hết thời gian cửa sổ → reset
    if (now - record.startTime > WINDOW) {
      ipRequests.set(ip, { count: 1, startTime: now });
    } else {
      // Nếu còn trong window, kiểm tra số lần gọi
      if (record.count >= RATE_LIMIT) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests, please try again later.' }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      record.count += 1;
      ipRequests.set(ip, record);
    }
  }

  // 🔸 2. Xác thực API routes (origin + API key)
  if (url.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const authKey = request.headers.get('x-api-key');

    const allowedOrigin = process.env.NEXT_PUBLIC_CLIENT_URL;
    const expectedApiKey = process.env.PRIVATE_API_KEY;

    if (origin !== allowedOrigin || authKey !== expectedApiKey) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Cho phép đi tiếp nếu hợp lệ
  return NextResponse.next();
}

// 🔹 Áp dụng middleware cho các route bạn muốn
export const config = {
  matcher: ['/api/:path*'], // chỉ áp dụng với API routes
};
