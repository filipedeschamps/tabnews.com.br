import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(authorization.canRequest('read:session'), getHandler);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:user:self', authenticatedUser);

  return response.status(200).json(secureOutputValues);
}
