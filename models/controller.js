import { v4 as uuidV4 } from 'uuid';
import session from 'models/session.js';
import logger from 'infra/logger.js';
import snakeize from 'snakeize';

import {
  InternalServerError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from '/errors/index.js';

async function injectRequestId(request, response, next) {
  request.context = { ...request.context, requestId: uuidV4() };
  next();
}

async function onNoMatchHandler(request, response) {
  const errorObject = new NotFoundError({ requestId: request.context.requestId });
  logger.info(snakeize(errorObject));
  return response.status(errorObject.statusCode).json(snakeize(errorObject));
}

function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
    const errorObject = { ...error, requestId: request.context.requestId };
    logger.info(snakeize(errorObject));
    return response.status(error.statusCode).json(snakeize(errorObject));
  }

  if (error instanceof UnauthorizedError) {
    const errorObject = { ...error, requestId: request.context.requestId };
    logger.info(snakeize(errorObject));
    session.clearSessionIdCookie(response);
    return response.status(error.statusCode).json(snakeize(errorObject));
  }

  const errorObject = new InternalServerError({
    requestId: request.context.requestId,
    errorId: error.errorId,
    stack: error.stack,
    statusCode: error.statusCode,
    errorUniqueCode: error.errorUniqueCode,
  });

  // TODO: Understand why `sanaize` is not logging the
  // `stack` property of the error object.
  logger.error(snakeize({ ...errorObject, stack: error.stack }));

  return response.status(errorObject.statusCode).json(snakeize(errorObject));
}

function logRequest(request, response, next) {
  const { method, url, headers, query, body, context } = request;

  const log = {
    method,
    url,
    headers,
    query,
    context,
    body,
  };

  logger.info(log);

  next();
}

export default Object.freeze({
  injectRequestId,
  onNoMatchHandler,
  onErrorHandler,
  logRequest,
});
