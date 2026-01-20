import { createRouter } from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import notification from 'models/notification';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(authorization.canRequest('read:session'), getValidationHandler, getHandler)
  .patch(authorization.canRequest('read:session'), patchHandler)
  .handler(controller.handlerOptions);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    page: 'optional',
    per_page: 'optional',
    read: 'optional',
  });

  request.query = cleanValues;

  return next();
}

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;

  let where = { user_id: authenticatedUser.id };

  if (typeof request.query.read === 'boolean') {
    where = { ...where, read: request.query.read };
  }

  const notificationsPage = await notification.findAll({
    where: where,
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const notificationsList = notificationsPage.rows;

  const secureOutputValues = authorization.filterOutput(
    authenticatedUser,
    'read:notifications:list',
    notificationsList,
  );

  notificationsPage.rows = secureOutputValues;

  return response.status(200).json({ ...notificationsPage });
}

async function patchHandler(request, response) {
  const authenticatedUser = request.context.user;

  await notification.markAllAsRead(authenticatedUser.id);

  return response.status(200).json({ success: true });
}
