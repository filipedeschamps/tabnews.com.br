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
  .post(authorization.canRequest('read:activation_token'), postHandler);

async function postHandler(request, response) {
  const userTryingToActivate = request.context.user;
  const tokenId = request.query.token;

  const tokenObject = await activation.activateUserUsingTokenId(tokenId);

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToActivate, 'read:activation_token', tokenObject);

  return response.status(200).json(authorizedValuesToReturn);
}
