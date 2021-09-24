import nextConnect from 'next-connect';
import { formatISO } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { NotFoundError, InternalServerError } from 'errors';

import BaseError from 'infra/errors/base-error';

import healthCheckerFactory from 'infra/health-checker';

const healthCheker = healthCheckerFactory();

export default nextConnect({
  attachParams: true,
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
})
  .use(traceHandler)
  .get(getHandler);

function traceHandler(request, _, next) {
  // Inclui um traceId para toda request que passa pelo servidor
  request.traceId = uuid();
  next();
}

async function getHandler(request, response) {
  const checkedDependencies = await healthCheker.doHealthCheck();

  return response.status(200).json({
    updated_at: formatISO(Date.now()),
    dependencies: checkedDependencies,
  });
}

async function onNoMatchHandler(request, response) {
  return response.status(404).json({ error: 'Not Found' });
}

function onErrorHandler(error, req, res, next) {
  console.log('traceId: ', traceId, 'error: ', error);
  if (error instanceof BaseError) {
    error.traceId(req.traceId);
    return res.status(error.code).json(error);
  }
}
