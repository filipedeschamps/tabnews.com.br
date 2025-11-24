import { noop } from '@tabnews/helpers';
import pino from 'pino';

import { axiomTransport } from './axiom-transport';

export function getLogger(options = {}) {
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV;

  if (['preview', 'production'].includes(environment) || process.env.AXIOM_DATASET) {
    const pinoLogger = pino(
      {
        ...options,
        base: {
          environment,
          ...options.base,
        },
      },
      axiomTransport(),
    );

    return pinoLogger;
  }

  const consoleLogger = {
    ...console,
    info: noop,
    fatal: console.error,
    flush: noop,
  };

  if (process.env.LOG_LEVEL === 'info') {
    // eslint-disable-next-line no-console
    consoleLogger.info = console.log;
  }

  return consoleLogger;
}
