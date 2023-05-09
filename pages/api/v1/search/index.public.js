import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user.js';
import search from 'models/search.js';
import validator from 'models/validator.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    page: 'optional',
    per_page: 'optional',
    search_term: 'required',
    search_scope: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = user.createAnonymous();

  const results = await search.doSearch(request.query);

  const contentList = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

  controller.injectPaginationHeaders(results.pagination, '/api/v1/search', response);

  response.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate');

  return response.status(200).json(secureOutputValues);
}
