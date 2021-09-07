import nextConnect from 'next-connect';
import migratorFactory from 'infra/migrator.js';

const migrator = migratorFactory();

export default nextConnect({
  attachParams: true,
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
})
  .use(authenticationHandler)
  .use(authorizationHandler)
  .get(getHandler)
  .post(postHandler);

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
  console.log(error);
  res.status(500).json({ error: error.message });
}
