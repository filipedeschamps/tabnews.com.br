import nextConnect from 'next-connect';

import analytics from 'models/analytics.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(300))
  .get(getHandler);

async function getHandler(request, response) {
  const contentsPublished = await analytics.getRootContentsPublished();

  return response.status(200).json(contentsPublished);
}
