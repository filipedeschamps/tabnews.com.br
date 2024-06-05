/* eslint-disable no-console */
import pino from 'pino';

function getLogger() {
  if (['preview', 'production'].includes(process.env.VERCEL_ENV)) {
    const pinoLogger = pino({
      base: {
        environment: process.env.VERCEL_ENV,
      },
      nestedKey: 'payload',
      redact: {
        paths: [
          'password',
          'email',
          'context.user.password',
          'context.user.email',
          'context.user.description',
          'context.session.token',
        ],
        remove: true,
      },
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
