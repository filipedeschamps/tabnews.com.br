import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ServiceError } from 'errors/index.js';

async function check(request) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (['test', 'development'].includes(process.env.NODE_ENV) || process.env.CI || process.env.GITHUB_ACTIONS) {
      return { success: true };
    }

    throw new ServiceError({
      message: 'Variáveis de ambiente UPSTASH_REDIS_REST_URL ou UPSTASH_REDIS_REST_TOKEN não encontradas.',
      action:
        'Configure as variáveis de ambiente UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN para habilitar o serviço de rate-limiting.',
      context: {
        upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL ? true : false,
        upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN ? true : false,
      },
      errorLocationCode: 'MIDDLEWARE:RATE_LIMIT:CHECK:ENV_MISSING',
    });
  }

  const ip = getIP(request);
  const method = request.method;
  const path = request.nextUrl.pathname;
  const limit = getLimit(method, path, ip);

  try {
    const generalRateLimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit.requests, limit.window),
    });

    return await generalRateLimit.limit(limit.identifier);
  } catch (error) {
    throw new ServiceError({
      message: error.message,
      action: 'Verifique se o serviço Upstash está disponível.',
      stack: error.stack,
      context: {
        ip,
        method,
        path,
      },
      errorLocationCode: 'MIDDLEWARE:RATE_LIMIT:CHECK',
    });
  }
}

function getIP(request) {
  const xff = request instanceof Request ? request.headers.get('x-forwarded-for') : request.headers['x-forwarded-for'];

  return xff ? (Array.isArray(xff) ? xff[0] : xff.split(',')[0]) : '127.0.0.1';
}

function getLimit(method, path, ip) {
  const defaultLimits = {
    general: {
      requests: 1000,
      window: '5 m',
    },
    'PATCH /api/v1/activation': {
      requests: 50,
      window: '30 m',
    },
    'POST /api/v1/contents': {
      requests: 50,
      window: '30 m',
    },
    'POST /api/v1/recovery': {
      requests: 50,
      window: '30 m',
    },
    'PATCH /api/v1/recovery': {
      requests: 50,
      window: '30 m',
    },
    'DELETE /api/v1/sessions': {
      requests: 50,
      window: '30 m',
    },
    'POST /api/v1/sessions': {
      requests: 50,
      window: '30 m',
    },
    'POST /api/v1/users': {
      requests: 50,
      window: '30 m',
    },
  };

  const configurationFromEnvironment = process.env.RATE_LIMITS ? JSON.parse(process.env.RATE_LIMITS) : {};
  const configuration = { ...defaultLimits, ...configurationFromEnvironment };
  const limitKey = configuration[`${method} ${path}`] ? `${method} ${path}` : 'general';

  const limit = {
    requests: configuration[limitKey].requests,
    window: configuration[limitKey].window,
    identifier: limitKey === 'general' ? `${ip}` : `${ip}:${method}:${path}`,
  };

  return limit;
}

export default Object.freeze({
  check,
});
