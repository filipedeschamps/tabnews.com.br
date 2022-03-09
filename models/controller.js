import { v4 as uuidV4 } from 'uuid';
import session from 'models/session.js';
import database from 'infra/database.js';

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
  await closeDatabaseConnection();

  const errorObject = new NotFoundError({ requestId: request.id });
  return response.status(errorObject.statusCode).json(errorObject);
}

async function onErrorHandler(error, request, response) {
  await closeDatabaseConnection();

  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
    return response.status(error.statusCode).json({ ...error, requestId: request.id });
  }

  if (error instanceof UnauthorizedError) {
    session.clearSessionIdCookie(response);
    return response.status(error.statusCode).json({ ...error, requestId: request.id });
  }

  const errorObject = new InternalServerError({
    requestId: request.id,
    errorId: error.errorId,
    stack: error.stack,
    statusCode: error.statusCode,
    errorUniqueCode: error.errorUniqueCode,
  });

  console.error(errorObject);

  return response.status(errorObject.statusCode).json(errorObject);
}

async function closeDatabaseConnection(request, response, next) {
  await database.closeConnection();

  if (next) {
    next();
  }
}

export default Object.freeze({
  injectRequestId,
  onNoMatchHandler,
  onErrorHandler,
  closeDatabaseConnection,
});
