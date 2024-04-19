import nextConnect from 'next-connect';

import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import getPageViewMetrics from 'models/page_view_metrics';
import user from 'models/user';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(cacheControl.swrMaxAge(300), getValidationHandler, getHandler);

function getValidationHandler(request, _, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const { username, slug } = request.query;

  const pageViewMetrics = await getPageViewMetrics(`/${username}/${slug}`);

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:visits', pageViewMetrics);

  return response.status(200).json(secureOutputValues);
}
