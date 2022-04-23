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
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanValues;

  next();
}

// TODO: cache the response
async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const contendFound = await content.findAll({
    where: {
      username: request.query.username,
      parent_id: null,
      status: 'published',
    },
    order: 'created_at ASC',
  });

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contendFound);

  return response.status(200).json(secureOutputValues);
}
