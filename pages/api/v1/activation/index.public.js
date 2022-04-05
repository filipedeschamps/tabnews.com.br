import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .patch(authorization.canRequest('read:activation_token'), patchHandler);

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
