import { NextResponse } from 'next/server';
import rateLimit from 'infra/rate-limit.js';
import snakeize from 'snakeize';

// TODO: Next.js still didn't fix this bug:
// https://github.com/vercel/next.js/issues/39262
// But this bug doesn't affect Preview and Production environments.
// So it's time enable the middleware on all routes, but then
// we need to skip these two tests for now as a collateral effect:
// https://github.com/filipedeschamps/tabnews.com.br/blob/35bd984db122f30ae3ed7a3b5d7baf830669a345/tests/integration/api/v1/contents/post.test.js#L268
// https://github.com/filipedeschamps/tabnews.com.br/blob/35bd984db122f30ae3ed7a3b5d7baf830669a345/tests/integration/api/v1/contents/%5Busername%5D/%5Bslug%5D/patch.test.js#L500

export const config = {
  matcher: ['/api/:path*'],
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
