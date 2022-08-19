import { NextResponse } from 'next/server';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';

// TODO: Add `/api/v1/contents` when Next.js fix this:
// https://github.com/vercel/next.js/issues/39262
// Actually, configure matcher to `/api/:path*` after they fix this bug.
export const config = {
  matcher: ['/api/v1/activation', '/api/v1/recovery', '/api/v1/sessions', '/api/v1/users', '/api/v1/user'],
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
    console.error(snakeize({ message: error.message, ...error }));
    return NextResponse.next();
  }
}
