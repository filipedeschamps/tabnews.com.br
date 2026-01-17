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
  .get(authorization.canRequest('read:session'), getHandler)
  .handler(controller.handlerOptions);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;

  const notifications = await notification.findAll(
    { where: { user_id: authenticatedUser.id } },
    { limit: 5, offset: 0 },
  );
  const countNotifications = await notification.count({ where: { user_id: authenticatedUser.id, is_read: false } });

  return response.status(200).json({ notifications: notifications, unreadCount: Number(countNotifications.count) });
}
