import { NextResponse } from 'next/server';
import snakeize from 'snakeize';

import logger from 'infra/logger.js';
import underMaintenance from 'infra/under-maintenance';

export const config = {
  matcher: ['/((?!_next/static|va/|favicon|manifest).*)'],
};

export function middleware(request) {
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
