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

  const notificationsPage = await notification.findAll({
    where: { user_id: authenticatedUser.id, read: request.query.read },
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

  await notification.update({ read: true }, { where: { user_id: authenticatedUser.id } });

  return response.status(200).json({ success: true });
}
