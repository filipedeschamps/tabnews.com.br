import pino from 'pino';

function getLogger() {
  if (['preview', 'production'].includes(process.env.VERCEL_ENV)) {
    const pinoLogger = pino({
      base: {
        environment: process.env.VERCEL_ENV,
      },
      nestedKey: 'payload',
      redact: [
        'headers.cookie',
        'password',
        'email',
        'body.password',
        'body.email',
        'context.user.password',
        'context.user.email',
        'context.session.token',
      ],
    });

    return pinoLogger;
  }

  // TODO: reimplement this in a more
  // sofisticated way.
  const consoleLogger = {
    trace: console.trace,
    debug: console.debug,
    info: ignore,
    warn: console.warn,
    error: console.error,
    fatal: console.error,
  };

  if (process.env.LOG_LEVEL === 'info') {
    consoleLogger.info = console.log;
  }

  return consoleLogger;
}

function ignore() {}

export default getLogger();
