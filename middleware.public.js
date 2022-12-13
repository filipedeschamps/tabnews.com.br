import { NextResponse } from 'next/server';
import logger from 'infra/logger.js';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';
import { UnauthorizedError } from '/errors/index.js';
import ip from 'models/ip.js';

export const config = {
  matcher: ['/((?!_next/static|va/|public/|favicon*|manifest.json).*)'],
};

export async function middleware(request) {
  if (process.env.VERCEL_ENV === 'production' && request.headers.get('host') != 'www.tabnews.com.br') {
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
    const rateLimitPaths = JSON.parse(process.env.RATE_LIMIT_PATHS || '["/api"]');
    if (!rateLimitPaths.find((path) => url.pathname?.startsWith(path))) {
      console.log({ without_rate_limit: url.pathname });
      return NextResponse.next();
    }
    console.log({ with_rate_limit: url.pathname });
    url.pathname = '/api/v1/_responses/rate-limit-reached';
    return NextResponse.rewrite(url);

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
