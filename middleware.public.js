import { NextResponse } from 'next/server';
import logger from 'infra/logger.js';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';
import { UnauthorizedError } from '/errors/index.js';
import ip from 'models/ip.js';
import ipCheck from 'ip';

export const config = {
  matcher: ['/((?!_next/static|va/|favicon|manifest).*)'],
};

export async function middleware(request) {
  if (!isFromCloudflare(request)) {
    console.log({
      ipClient: ip.extractFromRequest(request),
      'x-vercel-proxied-for': request.headers.get('x-vercel-proxied-for'),
      host: request.headers.get('host'),
      path: request.nextUrl.pathname,
    });
  }

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

function isFromCloudflare(request) {
  const socketIp = request.headers.get('x-vercel-proxied-for')?.split(', ').at(-1);
  return socketIp && cloudflareIPs.find((ipRange) => ipCheck.cidrSubnet(ipRange).contains(socketIp));
}

const cloudflareIPs = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];
