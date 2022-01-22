import nextConnect from 'next-connect';
import { formatISO } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { NotFoundError, InternalServerError } from 'errors';

import healthFactory from 'models/health';

const health = healthFactory();

export default nextConnect({
  attachParams: true,
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
})
  .use(injectRequestId)
  .get(getHandler);

async function injectRequestId(request, response, next) {
  request.id = uuid();
  next();
}

async function getHandler(request, response) {
  const checkedDependencies = await health.getDependencies();

  return response.status(200).json({
    updated_at: formatISO(Date.now()),
    dependencies: checkedDependencies,
  });
}

async function onNoMatchHandler(request, response) {
  const errorObject = new NotFoundError({ requestId: request.id });
  return response.status(errorObject.statusCode).json(errorObject);
}

function onErrorHandler(error, request, response) {
  const errorObject = new InternalServerError({ requestId: request.id, stack: error.stack });
  console.error(errorObject);
  return response.status(errorObject.statusCode).json(errorObject);
}
