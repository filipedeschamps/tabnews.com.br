import { truncate } from '@tabnews/helpers';
import { waitUntil } from '@vercel/functions';
import { randomUUID as uuidV4 } from 'node:crypto';
import snakeize from 'snakeize';

import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ServiceError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError,
  ValidationError,
} from 'errors';
import logger from 'infra/logger.js';
import webserver from 'infra/webserver.js';
import ip from 'models/ip.js';

function injectRequestMetadata(request, response, next) {
  request.context = {
    ...request.context,
    requestId: request.headers['x-vercel-id'] || uuidV4(),
    clientIp: ip.extractFromRequest(request),
  };

  if (next) {
    return next();
  }
}

function onNoMatchHandler(request, response) {
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  injectRequestMetadata(request);

  return onErrorHandler(
    new MethodNotAllowedError({
      message: `Método "${request.method}" não permitido para "${request.url}".`,
      action: 'Utilize um método HTTP válido para este recurso.',
    }),
    request,
    response,
  );
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof UnauthorizedError ||
    error instanceof ValidationError ||
    error instanceof MethodNotAllowedError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError ||
    error instanceof UnprocessableEntityError ||
    error instanceof TooManyRequestsError
  ) {
    const publicErrorObject = { ...error, requestId: request.context.requestId };

    logger.info({ err: error, context: clearContext(request.context) });

    return errorResponse(response, error.statusCode, snakeize(publicErrorObject));
  }

  const publicErrorObject = new InternalServerError({
    requestId: request.context?.requestId,
    errorId: error.errorId,
    statusCode: error.statusCode,
    errorLocationCode: error.errorLocationCode,
  });

  const ErrorClass = error instanceof ServiceError ? ServiceError : InternalServerError;
  const privateError = new ErrorClass({
    message: error.message,
    action: error.action,
    statusCode: error.statusCode,
    errorId: publicErrorObject.errorId,
    errorLocationCode: error.errorLocationCode,
    databaseErrorCode: error.databaseErrorCode,
    cause: error.cause,
    stack: error.stack,
    context: error.context,
  });

  logger.error({ err: privateError, context: clearContext(request.context) });

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
  const { headers, body, context } = request;

  const log = {
    headers: clearHeaders(headers),
    body: clearBody(body),
    context: clearContext(context),
  };

  logger.info(log);

  let resolve;
  const flushPromise = new Promise((res) => (resolve = res));

  waitUntil(flushPromise);

  response.on('close', async () => {
    await logger.flush();
    resolve();
  });

  return next();
}

const headersToRedact = ['authorization', 'cookie'];
const headerToOmit = [
  'access-control-allow-headers',
  'forwarded',
  'x-vercel-proxy-signature',
  'x-vercel-sc-headers',
  'x-vercel-oidc-token',
];

function clearHeaders(headers) {
  const cleanHeaders = { ...headers };

  headersToRedact.forEach((header) => {
    if (cleanHeaders[header]) {
      cleanHeaders[header] = '**';
    }
  });

  headerToOmit.forEach((header) => {
    delete cleanHeaders[header];
  });

  return [cleanHeaders];
}

const bodyToRedact = ['email', 'password'];

function clearBody(requestBody) {
  const cleanBody = { ...requestBody };

  if (typeof cleanBody.body === 'string') {
    cleanBody.body = truncate(cleanBody.body, 300);
  }

  bodyToRedact.forEach((key) => {
    if (cleanBody[key]) {
      cleanBody[key] = '**';
    }
  });

  return [cleanBody];
}

function clearContext(context) {
  const cleanContext = { ...context };

  if (cleanContext.user) {
    cleanContext.user = {
      id: context.user.id,
      username: context.user.username,
    };
  }

  return cleanContext;
}

function injectPaginationHeaders(pagination, acceptedParams, request, response) {
  const links = [];
  const { pathname } = new URL(request.url, webserver.host);
  const baseUrl = `${webserver.host}${pathname}`;

  const searchParams = new URLSearchParams();

  [...acceptedParams, 'page', 'per_page'].forEach((param) => {
    const value = request.query[param];

    if (value !== undefined) {
      searchParams.set(param, Array.isArray(value) ? value.join(',') : value);
    }
  });

  const pages = [
    { page: pagination.firstPage, rel: 'first' },
    { page: pagination.previousPage, rel: 'prev' },
    { page: pagination.nextPage, rel: 'next' },
    { page: pagination.lastPage, rel: 'last' },
  ];

  for (const { page, rel } of pages) {
    if (page) {
      searchParams.set('page', page);
      links.push(`<${baseUrl}?${searchParams.toString()}>; rel="${rel}"`);
    }
  }

  const linkHeaderString = links.join(', ');

  response.setHeader('Link', linkHeaderString);
  response.setHeader('X-Pagination-Total-Rows', pagination.totalRows);
}

function assertJsonContentType(request) {
  const contentType = request.headers['content-type'];
  const mediaType = contentType?.split(';')[0].trim().toLowerCase();
  const hasBody = Number(request.headers['content-length']) > 0 || !!request.headers['transfer-encoding'];

  if ((mediaType || hasBody) && mediaType !== 'application/json') {
    throw new ValidationError({
      message: 'O "Content-Type" enviado não é suportado.',
      action: 'Envie os dados no formato JSON com o header "Content-Type: application/json".',
      statusCode: 415,
      errorLocationCode: 'MODEL:CONTROLLER:ASSERT_JSON_CONTENT_TYPE:UNSUPPORTED_CONTENT_TYPE',
    });
  }
}

const handlerOptions = {
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
};

export default Object.freeze({
  handlerOptions,
  injectRequestMetadata,
  logRequest,
  injectPaginationHeaders,
  assertJsonContentType,
});
