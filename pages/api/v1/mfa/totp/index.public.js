import nextConnect from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import otp from 'models/otp';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    authorization.canRequest('read:session'),
    getHandler,
  );

function getHandler(request, response) {
  const authenticatedUser = request.context.user;
  const username = authenticatedUser.username;
  const totp = otp.createTotp(null, username);

  authenticatedUser.totp = totp.toString();

  const secureOutputValues = authorization.filterOutput(request.context.user, 'read:totp', authenticatedUser);

  return response.status(200).json(secureOutputValues);
}
