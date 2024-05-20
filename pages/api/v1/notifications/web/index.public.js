import nextConnect from 'next-connect';

import { NotFoundError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import { webNotifyQueries } from 'models/notifications';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(authorization.canRequest('update:user'), getHandler)
  .delete(authorization.canRequest('update:user'), deleteHandler)
  .patch(authorization.canRequest('update:user'), patchHandler);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const notificationsFound = await webNotifyQueries.findAllCountByUserId(userTryingToGet.id);

  if (!notificationsFound) {
    throw new NotFoundError({
      message: `Nenhuma notificação foi encontrada para o usuário informado.`,
      action: 'Verifique se existem notificações para o usuário.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATIONS:NOTIFICATIONS_NOT_FOUND',
      key: 'id',
    });
  }

  const notifications = await webNotifyQueries.findAllByUserId(userTryingToGet.id);

  return response.status(200).json(notifications);
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;

  const notificationsFound = await webNotifyQueries.findAllByUserId(userTryingToDelete.id);

  if (!notificationsFound) {
    throw new NotFoundError({
      message: `Nenhuma notificação foi encontrada para o usuário informado.`,
      action: 'Verifique se existem notificações para o usuário.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATIONS:NOTIFICATIONS_NOT_FOUND',
      key: 'id',
    });
  }

  const notificationUpdate = await webNotifyQueries.updateAllStatusByUserId(`draft`, userTryingToDelete.id);

  return response.status(200).json(notificationUpdate);
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;

  const notificationsFound = await webNotifyQueries.findAllByUserId(userTryingToPatch.id);

  if (!notificationsFound || notificationsFound.length === 0) {
    throw new NotFoundError({
      message: `Nenhuma notificação foi encontrada para o usuário informado.`,
      action: 'Verifique se existem notificações para o usuário.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATIONS:NOTIFICATIONS_NOT_FOUND',
      key: 'id',
    });
  }

  const allRead = notificationsFound.every((notification) => notification.status === 'read');

  if (allRead) {
    throw new NotFoundError({
      message: `Todas notificações já foram lidas.`,
      action: 'Verifique o status das notificações.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATIONS_ALL_ALREADY_READ',
      key: 'status',
    });
  }

  const notificationUpdate = await webNotifyQueries.updateAllStatusByUserId('read', userTryingToPatch.id);

  return response.status(200).json(notificationUpdate);
}
