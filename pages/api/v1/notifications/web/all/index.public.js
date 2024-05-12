import nextConnect from 'next-connect';

import { NotFoundError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import { NotificationWebManage } from 'models/notifications';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(authorization.canRequest('update:user'), getHandler);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const notificationFound = await NotificationWebManage.findAllCountByUserId(userTryingToGet.id);

  if (!notificationFound) {
    throw new NotFoundError({
      message: `Nenhuma notificação foi encontrada para o usuário informado.`,
      action: 'Verifique se existem notificações para o usuário.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATIONS:NOTIFICATIONS_NOT_FOUND',
      key: 'id',
    });
  }

  const notifications = await NotificationWebManage.findAllByUserId(userTryingToGet.id);

  return response.status(200).json(notifications);
}
