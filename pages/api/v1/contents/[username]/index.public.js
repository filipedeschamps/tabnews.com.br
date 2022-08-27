import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';
import user from 'models/user.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
}).get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    page: 'optional',
    per_page: 'optional',
    strategy: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const results = await content.findWithStrategy({
    strategy: request.query.strategy,
    where: {
      owner_username: request.query.username,
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
