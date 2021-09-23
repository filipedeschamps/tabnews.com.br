import nextConnect from 'next-connect';
import { v4 as uuid } from 'uuid';
import migratorFactory from 'infra/migrator.js';

import BaseError from 'infra/errors/base-error';

const migrator = migratorFactory();

export default nextConnect({
  attachParams: true,
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
})
  .use(traceHandler)
  .use(authenticationHandler)
  .use(authorizationHandler)
  .get(getHandler)
  .post(postHandler);

async function traceHandler(request, response, next) {
  // Inclui um traceId para toda request que passa pelo servidor
  request.traceId = uuid();
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

// TODO: create a pattern with Custom Errors.
// Do not rely on this responses right now.

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
