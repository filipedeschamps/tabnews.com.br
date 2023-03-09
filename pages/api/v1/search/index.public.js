import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import user from 'models/user';
import search from 'models/search';

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
    query: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = user.createAnonymous();

  const results = await search.findAll({
    where: {
      search: {
        title: request.query.query,
      },
    },
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const contentList = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

  return response.status(200).json(secureOutputValues);
}
