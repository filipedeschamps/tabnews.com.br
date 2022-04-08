import pino from 'pino';

function getTransportObject() {
  if (['test', 'development'].includes(process.env.NODE_ENV) || process.env.CI) {
    return {
      transport: {
        target: 'pino-pretty',
      },
    };
  }
}

function getLogLevel() {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }

  return 'warn';
}

const logger = pino({
  base: {
    environment: process.env.VERCEL_ENV || 'local',
  },
  level: getLogLevel(),
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
  ...getTransportObject(),
});

export default logger;
