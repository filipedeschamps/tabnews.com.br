import { createRouter } from 'next-connect';

import analytics from 'models/analytics.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(300))
  .get(getHandler)
  .handler(controller.handlerOptions);

async function getHandler(request, response) {
  const contentsPublished = await analytics.getRootContentsPublished();

  return response.status(200).json(contentsPublished);
}
