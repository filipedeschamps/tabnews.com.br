import { NextResponse } from 'next/server';
import logger from 'infra/logger.js';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';
import { UnauthorizedError } from '/errors/index.js';
import ip from 'models/ip.js';

export const config = {
  matcher: ['/((?!_next/static|va/|favicon|manifest).*)'],
};

export async function middleware(request) {
  if (process.env.VERCEL_ENV === 'production' && !ip.isRequestFromCloudflare(request)) {
    const publicErrorObject = new UnauthorizedError({
      message: 'Host não autorizado. Por favor, acesse https://www.tabnews.com.br.',
      action: 'Não repita esta requisição.',
    });

    const privateErrorObject = {
      ...publicErrorObject,
      context: {
        clientIp: ip.extractFromRequest(request),
      },
    };
    logger.info(snakeize(privateErrorObject));

    return new NextResponse(JSON.stringify(publicErrorObject), {
      status: 401,
      headers: {
        'content-type': 'application/json',
      },
    });
  }

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
