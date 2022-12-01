import { NextResponse, userAgent } from 'next/server';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';
import ip from 'models/ip.js';

export const config = {
  matcher: ['/api/:path*'],
};

export async function middleware(request) {
  const url = request.nextUrl;
  console.log({
    scope: 'MIDDLEWARE_REQUEST',
    request: {
      ip: ip.extractFromRequest(request),
      pathname: request.nextUrl.pathname,
      host: process.env.VERCEL_URL,
      url: request.nextUrl,
      method: request.method,
      userAgent: userAgent(request),
      geo: request.geo,
    },
    'process.env.NODE_ENV': process.env.NODE_ENV,
  });

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
