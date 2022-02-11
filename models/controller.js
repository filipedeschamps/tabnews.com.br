import { v4 as uuidV4 } from 'uuid';
import session from 'models/session.js';

import {
  InternalServerError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from '/errors/index.js';

async function injectRequestId(request, response, next) {
  request.id = uuidV4();
  next();
}

async function onNoMatchHandler(request, response) {
  const errorObject = new NotFoundError({ requestId: request.id });
  return response.status(errorObject.statusCode).json(errorObject);
}

function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
    return response.status(error.statusCode).json({ ...error, requestId: request.id });
  }

  if (error instanceof UnauthorizedError) {
    session.clearSessionIdCookie(response);
    return response.status(error.statusCode).json({ ...error, requestId: request.id });
  }

  const errorObject = new InternalServerError({
    message: error.message,
    action: error.action,
    requestId: request.id,
    errorId: error.errorId,
    stack: error.stack,
    statusCode: error.statusCode,
    errorUniqueCode: error.errorUniqueCode,
  });

  console.error(errorObject);

  return response.status(errorObject.statusCode).json(errorObject);
}

export default Object.freeze({
  injectRequestId,
  onNoMatchHandler,
  onErrorHandler,
});
