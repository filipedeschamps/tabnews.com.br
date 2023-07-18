import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import validator from 'models/validator.js';
import content from 'models/content.js';
import user from 'models/user.js';

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
    username: 'required',
    page: 'optional',
    per_page: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const userStoredFromDatabase = await user.findOneByUsername(request.query.username, {
    withBalance: true,
  });

  authorization.filterOutput(userTryingToGet, 'read:user', userStoredFromDatabase);

  const results = await content.findUserVotes({
    username: request.query.username,
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:votes', results.rows);

  controller.injectPaginationHeaders(results.pagination, `/api/v1/users/${request.query.username}/votes`, response);

  return response.status(200).json(secureOutputValues);
}
