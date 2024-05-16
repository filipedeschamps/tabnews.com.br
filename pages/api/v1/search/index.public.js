import nextConnect from 'next-connect';

import { NotFoundError } from 'errors';
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
  .use(cacheControl.swrMaxAge(10))
  .get(getValidationHandler, getHandler);

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
  const { q, page, per_page, sort } = request.query;

  const contentFound = await search.findAll({ searchTerm: q, sortBy: sort, page: page, perPage: per_page });

  if (!contentFound) {
    throw new NotFoundError({
      message: `A busca não foi encontrado no sistema.`,
      action: 'Verifique se o "query" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:GET_HANDLER:SEARCH_NOT_FOUND',
      key: 'q',
    });
  }

  return response.status(200).json(contentFound);
}
