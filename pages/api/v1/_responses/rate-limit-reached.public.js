import snakeize from 'snakeize';
import logger from 'infra/logger.js';
import ip from 'models/ip.js';
import { TooManyRequestsError } from 'errors/index.js';

export default function handler(request, response) {
  const error = new TooManyRequestsError({
    context: {
      method: request.method,
      url: request.url,
      body: request.body,
      clientIp: ip.extractFromRequest(request),
      type: 'general',
    },
  });

  logger.error(snakeize(error));
  delete error.context;

  response.status(error.statusCode).json(snakeize(error));
}
