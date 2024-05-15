import nextConnect from 'next-connect';

import { NotFoundError } from 'errors';
import authentication from 'models/authentication';
import cacheControl from 'models/cache-control';
import controller from 'models/controller';
import search from 'models/search';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(cacheControl.swrMaxAge(10), getHandler);

async function getHandler(request, response) {
  const contentFound = await search.findAllTrends();

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
