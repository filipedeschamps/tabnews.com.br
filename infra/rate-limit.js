import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ServiceError } from 'errors/index.js';
import webserver from 'infra/webserver.js';
import ip from 'models/ip.js';

async function check(request) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!webserver.isLambdaServer()) {
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

  const realIp = ip.extractFromRequest(request);
  const method = request.method;
  const path = request.nextUrl.pathname;
  const limit = getLimit(method, path, realIp);
  if (!limit) return { success: true };

  let timeout;

  try {
    const generalRateLimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit.requests, limit.window),
    });

    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        reject({ message: 'Upstash não respondeu dentro de 4s.' });
      }, 4000);
    });

    return await Promise.race([generalRateLimit.limit(limit.identifier), timeoutPromise]);
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
  } finally {
    clearTimeout(timeout);
  }
}

function getLimit(method, path, ip) {
  const defaultLimits = {
    rateLimitPaths: [],
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

  if (!configuration.rateLimitPaths.find((rateLimitPath) => path?.startsWith(rateLimitPath))) {
    return;
  }

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
