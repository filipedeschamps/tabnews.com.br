import nextConnect from 'next-connect';

import cacheControl from 'models/cache-control';
import controller from 'models/controller';
import search from 'models/search';
import validator from 'models/validator';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(cacheControl.swrMaxAge(10), getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    q: 'required',
    page: 'optional',
    per_page: 'optional',
    sort: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const results = await search.findAll({
    q: request.query.q,
    sort: request.query.sort || 'new',
    page: request.query.page || 1,
    per_page: request.query.per_page || 30,
  });

  const contentListFound = results;

  return response.status(200).json(contentListFound);
}
