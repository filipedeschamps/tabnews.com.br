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
  .put(authorization.canRequest('update:user'), putHandler);

async function putHandler(request, response) {
  const userTryingToPut = request.context.user;

  const notificationFound = await NotificationWebManage.findAllByUserId(userTryingToPut.id);

  if (!notificationFound) {
    throw new NotFoundError({
      message: `Nenhuma notificação foi encontrada para o usuário informado.`,
      action: 'Verifique se existem notificações para o usuário.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATIONS:NOTIFICATIONS_NOT_FOUND',
      key: 'id',
    });
  }

  const notificationUpdate = await NotificationWebManage.markAllAsReadByUserId(userTryingToPut.id);

  return response.status(200).json(notificationUpdate);
}
