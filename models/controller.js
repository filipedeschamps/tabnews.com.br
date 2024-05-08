import snakeize from 'snakeize';
import { v4 as uuidV4 } from 'uuid';

import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError,
  ValidationError,
} from 'errors';
import logger from 'infra/logger.js';
import webserver from 'infra/webserver.js';
import ip from 'models/ip.js';
import session from 'models/session.js';

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
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  injectRequestMetadata(request);
  const publicErrorObject = new MethodNotAllowedError({
    message: `Método "${request.method}" não permitido para "${request.url}".`,
    action: 'Utilize um método HTTP válido para este recurso.',
    requestId: request.context?.requestId || uuidV4(),
  });

  const privateErrorObject = { ...publicErrorObject, context: { ...request.context } };
  logger.info(snakeize(privateErrorObject));

  return errorResponse(response, publicErrorObject.statusCode, snakeize(publicErrorObject));
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof MethodNotAllowedError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError ||
    error instanceof UnprocessableEntityError ||
    error instanceof TooManyRequestsError
  ) {
    const publicErrorObject = { ...error, requestId: request.context.requestId };

    const privateErrorObject = { ...publicErrorObject, context: { ...request.context } };
    logger.info(snakeize(privateErrorObject));

    return errorResponse(response, error.statusCode, snakeize(publicErrorObject));
  }

  if (error instanceof UnauthorizedError) {
    const publicErrorObject = { ...error, requestId: request.context.requestId };

    const privateErrorObject = { ...publicErrorObject, context: { ...request.context } };
    logger.info(snakeize(privateErrorObject));

    session.clearSessionIdCookie(response);

    return errorResponse(response, error.statusCode, snakeize(publicErrorObject));
  }

  const publicErrorObject = new InternalServerError({
    requestId: request.context?.requestId,
    errorId: error.errorId,
    statusCode: error.statusCode,
    errorLocationCode: error.errorLocationCode,
  });

  const privateErrorObject = {
    ...new InternalServerError({
      ...error,
      requestId: request.context?.requestId,
    }),
    context: { ...request.context },
  };

  logger.error(snakeize(privateErrorObject));

  return errorResponse(response, publicErrorObject.statusCode, snakeize(publicErrorObject));
}

function errorResponse(response, statusCode, publicErrorObject) {
  response.status(statusCode);

  const isStream = response.getHeader('Content-Type') === 'application/x-ndjson';
  if (isStream) {
    response.write(JSON.stringify(publicErrorObject) + '\n');
    response.end();
  }

  return response.json(publicErrorObject);
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
  const baseUrl = `${webserver.host}${endpoint}`;

  const searchParams = new URLSearchParams();

  if (pagination.strategy) {
    searchParams.set('strategy', pagination.strategy);
  }

  const pages = [
    { page: pagination.firstPage, rel: 'first' },
    { page: pagination.previousPage, rel: 'prev' },
    { page: pagination.nextPage, rel: 'next' },
    { page: pagination.lastPage, rel: 'last' },
  ];

  for (const { page, rel } of pages) {
    if (page) {
      searchParams.set('page', page);
      searchParams.set('per_page', pagination.perPage);
      links.push(`<${baseUrl}?${searchParams.toString()}>; rel="${rel}"`);
    }
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
