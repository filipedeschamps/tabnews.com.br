import { NextResponse } from 'next/server';
import snakeize from 'snakeize';

import { UnauthorizedError } from 'errors';
import logger from 'infra/logger.js';
import rateLimit from 'infra/rate-limit.js';
import underMaintenance from 'infra/under-maintenance';
import webserver from 'infra/webserver.js';
import ip from 'models/ip.js';

export const config = {
  matcher: ['/((?!_next/static|va/|favicon|manifest).*)'],
};

export async function middleware(request) {
  if (webserver.isProduction && !ip.isRequestFromCloudflare(request)) {
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

  const isUnderMaintenance = underMaintenance.check(request);

  if (isUnderMaintenance) {
    return new NextResponse(isUnderMaintenance.body, {
      status: isUnderMaintenance.status,
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

    if (url.pathname === '/api/v1/swr') {
      return new NextResponse(JSON.stringify({ timestamp: Date.now() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return NextResponse.next();
  } catch (error) {
    logger.error(snakeize({ message: error.message, ...error }));
    return NextResponse.next();
  }
}
