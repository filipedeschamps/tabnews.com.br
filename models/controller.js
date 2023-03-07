import { v4 as uuidV4 } from 'uuid';
import snakeize from 'snakeize';

import ip from 'models/ip.js';
import session from 'models/session.js';
import logger from 'infra/logger.js';
import webserver from 'infra/webserver.js';

import {
  InternalServerError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  TooManyRequestsError,
  UnprocessableEntityError,
} from '/errors/index.js';

async function injectRequestMetadata(request, response, next) {
  request.context = {
    ...request.context,
    requestId: uuidV4(),
    clientIp: ip.extractFromRequest(request),
  };

  if (next) {
    next();
  }
}

async function onNoMatchHandler(request, response) {
  injectRequestMetadata(request);
  const publicErrorObject = new NotFoundError({ requestId: request.context?.requestId || uuidV4() });

  const privateErrorObject = { ...publicErrorObject, context: { ...request.context } };
  logger.info(snakeize(privateErrorObject));

  return response.status(publicErrorObject.statusCode).json(snakeize(publicErrorObject));
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError ||
    error instanceof UnprocessableEntityError ||
    error instanceof TooManyRequestsError
  ) {
    const publicErrorObject = { ...error, requestId: request.context.requestId };

    const privateErrorObject = { ...publicErrorObject, context: { ...request.context } };
    logger.info(snakeize(privateErrorObject));

    return response.status(error.statusCode).json(snakeize(publicErrorObject));
  }

  if (error instanceof UnauthorizedError) {
    const publicErrorObject = { ...error, requestId: request.context.requestId };

    const privateErrorObject = { ...publicErrorObject, context: { ...request.context } };
    logger.info(snakeize(privateErrorObject));

    session.clearSessionIdCookie(response);

    return response.status(error.statusCode).json(snakeize(publicErrorObject));
  }

  const publicErrorObject = new InternalServerError({
    requestId: request.context?.requestId,
    errorId: error.errorId,
    statusCode: error.statusCode,
    errorLocationCode: error.errorLocationCode,
  });

  const privateErrorObject = { ...publicErrorObject, context: { ...request.context }, stack: error.stack };

  logger.error(snakeize(privateErrorObject));

  return response.status(publicErrorObject.statusCode).json(snakeize(publicErrorObject));
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

function injectPaginationHeaders(pagination, endpoint, response) {
  const links = [];
  const baseUrl = `${webserver.getHost()}${endpoint}?strategy=${pagination.strategy}`;

  if (pagination.firstPage) {
    links.push(`<${baseUrl}&page=${pagination.firstPage}&per_page=${pagination.perPage}>; rel="first"`);
  }

  if (pagination.previousPage) {
    links.push(`<${baseUrl}&page=${pagination.previousPage}&per_page=${pagination.perPage}>; rel="prev"`);
  }

  if (pagination.nextPage) {
    links.push(`<${baseUrl}&page=${pagination.nextPage}&per_page=${pagination.perPage}>; rel="next"`);
  }

  if (pagination.lastPage) {
    links.push(`<${baseUrl}&page=${pagination.lastPage}&per_page=${pagination.perPage}>; rel="last"`);
  }

  const linkHeaderString = links.join(', ');

  response.setHeader('Link', linkHeaderString);
  response.setHeader('X-Pagination-Total-Rows', pagination.totalRows);
}

export default Object.freeze({
  injectRequestMetadata,
  onNoMatchHandler,
  onErrorHandler,
  logRequest,
  injectPaginationHeaders,
});
