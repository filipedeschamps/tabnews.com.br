import { NextResponse } from 'next/server';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';

export const config = {
  matcher: ['/api/v1/sessions'],
};

export async function middleware(request) {
  const url = request.nextUrl;

  try {
    const rateLimitResult = await rateLimit.check(request);

    if (!rateLimitResult.success && url.pathname === '/api/v1/sessions') {
      url.pathname = '/api/v1/_responses/rate-limit-reached-sessions'; // Fake response.
      return NextResponse.rewrite(url);
    }

    if (!rateLimitResult.success) {
      url.pathname = '/api/v1/_responses/rate-limit-reached';
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  } catch (error) {
    console.error(snakeize(error));
    return NextResponse.next();
  }
}
