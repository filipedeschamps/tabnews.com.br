import { createRouter } from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import favorites from 'models/favorites.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(getValidationHandler, authorization.canRequest('update:user'), getHandler)
  .handler(controller.handlerOptions);

function getValidationHandler(request, _, next) {
  const cleanValues = validator(request.query, {
    content_id: 'required',
  });

  request.query = cleanValues;

  return next();
}

async function getHandler(request, response) {
  const { id: user_id } = request.context.user;
  const { content_id } = request.query;

  const result = await favorites.findOne({
    user_id,
    content_id: content_id,
  });

  return response.status(200).json(result);
}
