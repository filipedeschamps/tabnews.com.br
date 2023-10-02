import nextConnect from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import reward from 'models/reward';
import session from 'models/session';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(injectUserWithBalance)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(authorization.canRequest('read:session'), renewSessionIfNecessary, getHandler);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;

  authenticatedUser.tabcoins += await reward(request);

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:user:self', authenticatedUser);

  return response.status(200).json(secureOutputValues);
}

async function renewSessionIfNecessary(request, response, next) {
  let sessionObject = request.context.session;

  // Renew session if it expires in less than 3 weeks.
  if (new Date(sessionObject.expires_at) < Date.now() + 1000 * 60 * 60 * 24 * 7 * 3) {
    sessionObject = await session.renew(sessionObject.id, response);

    request.context.session = sessionObject;
  }
  return next();
}

function injectUserWithBalance(request, response, next) {
  return authentication.injectAnonymousOrUser(request, response, next, {
    withBalance: true,
  });
}
