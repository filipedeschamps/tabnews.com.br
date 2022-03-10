import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import activate from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .get(authorization.canRequest('read:activation_token'), getHandler);

async function getHandler(request, response) {
  const userTryingToActivate = request.context.user;
  const tokenId = request.query.token;

  const activatedUser = await activate.activateUserUsingTokenId(tokenId);

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToActivate, 'read:user', activatedUser);

  return response.status(200).json(authorizedValuesToReturn);
}
