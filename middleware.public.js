import { NextResponse } from 'next/server';

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
}
