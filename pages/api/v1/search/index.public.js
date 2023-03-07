import content from 'models/content.js';
import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import validator from 'models/validator.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import next from 'next';

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
    page: 'optional',
    per_page: 'optional',
    strategy: 'optional',
    query: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  const results = await content.findWithStrategy({
    strategy: request.query.strategy,
    where: {
      parent_id: null,
      status: 'published',
      like: {
        title: '%' + request.query.query + '%',
      },
    },
    attributes: {
      exclude: ['body'],
    },
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const contentList = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

  controller.injectPaginationHeaders(results.pagination, '/api/v1/contents', response);
  return response.status(200).json(secureOutputValues);
}
