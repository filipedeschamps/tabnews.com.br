import { createRouter } from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import notification from 'models/notification';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .patch(authorization.canRequest('read:session'), patchValidationHandler, patchHandler)
  .handler(controller.handlerOptions);

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    id: 'required',
  });

  request.query = cleanValues;

  return next();
}

async function patchHandler(request, response) {
  const authenticatedUser = request.context.user;

  await notification.read(request.query.id, authenticatedUser.id);

  return response.status(200).json({ success: true });
}
