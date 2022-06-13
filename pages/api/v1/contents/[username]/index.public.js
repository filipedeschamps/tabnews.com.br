import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
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

// TODO: cache the response
async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const results = await content.findWithStrategy({
    strategy: 'descending',
    where: {
      username: request.query.username,
      parent_id: null,
      status: 'published',
    },
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const contentListFound = results.rows;
  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  controller.injectPaginationHeaders(results.pagination, `/api/v1/contents/${request.query.username}`, response);
  return response.status(200).json(secureOutputValues);
}
