import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import migrator from 'infra/migrator.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .get(authorization.canRequest('read:migration'), getHandler)
  .post(authorization.canRequest('create:migration'), postHandler)
  .use(controller.closeDatabaseConnection);

async function getHandler(request, response, next) {
  const pendingMigrations = await migrator.listPendingMigrations();
  response.status(200).json(pendingMigrations);
  return next();
}

async function postHandler(request, response, next) {
  const migratedMigrations = await migrator.runPendingMigrations();

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }

  response.status(200).json(migratedMigrations);
  return next();
}
