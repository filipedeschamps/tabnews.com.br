import nextConnect from 'next-connect';

import { NotFoundError } from 'errors';
import authentication from 'models/authentication';
import authorization from 'models/authorization';
import cacheControl from 'models/cache-control';
import controller from 'models/controller';
import search from 'models/search';
import user from 'models/user';
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
    page: 'optional',
    per_page: 'optional',
    sort: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const { q, page, per_page, sort } = request.query;

  const contentFound = await search.findAll(q, page, per_page, sort);

  if (!contentFound) {
    throw new NotFoundError({
      message: `A busca não foi encontrado no sistema.`,
      action: 'Verifique se o "query" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:GET_HANDLER:SEARCH_NOT_FOUND',
      key: 'q',
    });
  }

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content', contentFound);

  return response.status(200).json(secureOutputValues);
}
