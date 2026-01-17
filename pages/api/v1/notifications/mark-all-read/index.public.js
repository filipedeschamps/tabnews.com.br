import { createRouter } from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import notification from 'models/notification';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .patch(authorization.canRequest('read:session'), patchHandler)
  .handler(controller.handlerOptions);

async function patchHandler(request, response) {
  const authenticatedUser = request.context.user;

  await notification.markAllAsRead(authenticatedUser.id);

  return response.status(200).json({ success: true });
}
