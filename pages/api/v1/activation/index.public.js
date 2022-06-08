import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .patch(patchValidationHandler, authorization.canRequest('read:activation_token'), patchHandler);

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
  });

  request.body = cleanValues;
  next();
}
async function patchHandler(request, response) {
  const userTryingToActivate = request.context.user;
  const insecureInputValues = request.body;

  //TODO: validate input values with the new validation strategy
  const secureInputValues = authorization.filterInput(
    userTryingToActivate,
    'read:activation_token',
    insecureInputValues
  );

  const tokenObject = await activation.activateUserUsingTokenId(secureInputValues.tokenId);

  const authorizedValuesToReturn = authorization.filterOutput(
    userTryingToActivate,
    'read:activation_token',
    tokenObject
  );

  return response.status(200).json(authorizedValuesToReturn);
}
