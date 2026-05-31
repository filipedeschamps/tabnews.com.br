import { createRouter } from 'next-connect';

import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .patch(patchValidationHandler, authorization.canRequest('read:activation_token'), patchHandler)
  .handler(controller.handlerOptions);

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
  });

  request.body = cleanValues;
  return next();
}
async function patchHandler(request, response) {
  const userTryingToActivate = request.context.user;
  const insecureInputValues = request.body;

  //TODO: validate input values with the new validation strategy
  const secureInputValues = authorization.filterInput(
    userTryingToActivate,
    'read:activation_token',
    insecureInputValues,
  );

  const tokenObject = await activation.activateUserUsingTokenId(secureInputValues.tokenId);

  const authorizedValuesToReturn = authorization.filterOutput(
    userTryingToActivate,
    'read:activation_token',
    tokenObject,
  );

  return response.status(200).json(authorizedValuesToReturn);
}
