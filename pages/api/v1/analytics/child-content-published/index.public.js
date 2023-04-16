import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import analytics from 'models/analytics.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(getHandler);

async function getHandler(request, response) {
  const contentsPublished = await analytics.getChildContentsPublished();

  response.setHeader('Cache-Control', 'public, 300, stale-while-revalidate');
  return response.status(200).json(contentsPublished);
}
