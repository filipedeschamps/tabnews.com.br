import nextConnect from 'next-connect';
import { v4 as uuid } from 'uuid';
import migratorFactory from 'infra/migrator.js';
import { InternalServerError, NotFoundError } from '/errors';

const migrator = migratorFactory();

export default nextConnect({
  attachParams: true,
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
})
  .use(injectRequestId)
  .use(authenticationHandler)
  .use(authorizationHandler)
  .get(getHandler)
  .post(postHandler);

async function injectRequestId(request, response, next) {
  request.id = uuid();
  next();
}

async function authenticationHandler(request, response, next) {
  // TODO: implement authentication
  console.log('Trying to authenticate');
  next();
}

async function authorizationHandler(request, response, next) {
  // TODO: implement authorization
  console.log('Trying to authorize');
  next();
}

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  return response.status(200).json(migratedMigrations);
}

async function onNoMatchHandler(request, response) {
  const errorObject = new NotFoundError({ requestId: request.id, stack: new Error().stack });
  return response.status(errorObject.statusCode).json(errorObject);
}

function onErrorHandler(error, request, response) {
  const errorObject = new InternalServerError({ requestId: request.id, stack: error.stack });
  console.error(errorObject);
  return response.status(errorObject.statusCode).json(errorObject);
}
