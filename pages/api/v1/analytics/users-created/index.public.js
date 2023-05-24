import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import analytics from 'models/analytics.js';
import cacheControl from 'models/cache-control';

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
  const usersCreated = await analytics.getUsersCreated();

  return response.status(200).json(usersCreated);
}
