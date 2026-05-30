import { formatISO } from 'date-fns';
import { createRouter } from 'next-connect';

import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import health from 'models/health.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(5))
  .get(getHandler)
  .handler(controller.handlerOptions);

async function getHandler(request, response) {
  let statusCode = 200;

  const checkedDependencies = await health.getDependencies();

  if (checkedDependencies.database.status === 'unhealthy') {
    statusCode = 503;
  }

  return response.status(statusCode).json({
    updated_at: formatISO(Date.now()),
    dependencies: checkedDependencies,
  });
}
