import nextConnect from 'next-connect';

import { NotFoundError } from 'errors';
import authentication from 'models/authentication';
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
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(cacheControl.swrMaxAge(10), getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    q: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const { q } = request.query;

  const contentFound = await search.findAllSuggestions(q);

  if (!contentFound) {
    throw new NotFoundError({
      message: `A busca por Trends não foi encontrado no sistema.`,
      action: 'Verifique se o "query" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:GET_HANDLER:SEARCH_TRENDS_NOT_FOUND',
      key: 'q',
    });
  }

  return response.status(200).json(contentFound);
}
