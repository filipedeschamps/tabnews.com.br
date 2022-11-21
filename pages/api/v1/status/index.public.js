import nextConnect from 'next-connect';
import { formatISO } from 'date-fns';
import controller from 'models/controller.js';
import health from 'models/health.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(getHandler);

async function getHandler(request, response) {
  let statusCode = 200;

  const checkedDependencies = await health.getDependencies();

  if (checkedDependencies.database.status === 'unhealthy') {
    statusCode = 503;
  }

  response.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate');

  return response.status(statusCode).json({
    updated_at: formatISO(Date.now()),
    dependencies: checkedDependencies,
  });
}
