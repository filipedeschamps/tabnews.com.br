import nextConnect from 'next-connect';
import { formatISO } from 'date-fns';
import controller from 'models/controller.js';
import health from 'models/health';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .get(getHandler)
  .use(controller.closeDatabaseConnection);

async function getHandler(request, response, next) {
  let statusCode = 200;

  const checkedDependencies = await health.getDependencies();

  if (checkedDependencies.database.status === 'unhealthy') {
    statusCode = 503;
  }

  response.status(statusCode).json({
    updated_at: formatISO(Date.now()),
    dependencies: checkedDependencies,
  });

  return next();
}
