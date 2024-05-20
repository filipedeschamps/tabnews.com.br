import nextConnect from 'next-connect';

import { NotFoundError, UnprocessableEntityError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import { webNotifyQueries } from 'models/notifications';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(validationHandler, authorization.canRequest('update:user'), getHandler)
  .delete(validationHandler, authorization.canRequest('update:user'), deleteHandler)
  .patch(validationHandler, authorization.canRequest('update:user'), patchHandler);

function validationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    id: 'required',
  });

  request.query = cleanQueryValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const notificationId = request.query.id;

  const notificationToDelete = await webNotifyQueries.findOneById(notificationId);

  if (notificationToDelete.status === 'draft') {
    throw new NotFoundError({
      message: `A notificação informada foi deletada e não está disponível.`,
      action: 'Verifique o status da notificação.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATION_DELETED',
      key: 'status',
    });
  }

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

  const notification = await webNotifyQueries.findOneById(notificationId);

  return response.status(200).json(notification);
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const notificationId = request.query.id;

  const notificationToDelete = await webNotifyQueries.findOneById(notificationId);

  if (notificationToDelete.status === 'draft') {
    throw new NotFoundError({
      message: `A notificação informada foi deletada e não pode ser marcada como lida.`,
      action: 'Verifique o status da notificação.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATION_DELETED',
      key: 'status',
    });
  }

  const notificationFound = await webNotifyQueries.findOneById(notificationId);
  if (!notificationFound) {
    throw new NotFoundError({
      message: `A notificação informada não foi encontrada no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATION_NOT_FOUND',
      key: 'id',
    });
  }

  if (notificationFound.status === 'read') {
    throw new NotFoundError({
      message: `A notificação informada já foi lida.`,
      action: 'Verifique o status da notificação.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATION_ALREADY_READ',
      key: 'status',
    });
  }

  if (userTryingToPatch.id !== notificationFound.recipient_id) {
    throw new UnprocessableEntityError({
      message: `Você não pode realizar esta operação em notificações de outros usuários.`,
      action: 'Realize esta operação em suas próprias notificações.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:OWN_NOTIFICATION',
      key: 'notifications',
    });
  }

  // Atualizar o status da notificação para "read"
  const notificationUpdate = await webNotifyQueries.updateOneStatusById('read', notificationId);

  return response.status(200).json(notificationUpdate);
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;

  const notificationsFound = await webNotifyQueries.findAllCountByUserId(userTryingToDelete.id);

  if (!notificationsFound) {
    throw new NotFoundError({
      message: `Nenhuma notificação foi encontrada para o usuário informado.`,
      action: 'Verifique se existem notificações para o usuário.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATIONS:NOTIFICATIONS_NOT_FOUND',
      key: 'id',
    });
  }

  const notificationFound = await webNotifyQueries.findOneById(request.query.id);

  if (!notificationFound) {
    throw new NotFoundError({
      message: `A notificação informada não foi encontrada no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATIONS:NOTIFICATIONS_NOT_FOUND',
      key: 'id',
    });
  }

  if (notificationFound.status == 'draft') {
    throw new NotFoundError({
      message: `A notificação informada já deletada.`,
      action: 'Verifique o status da notificação.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATION_ALREADY_READ',
      key: 'status',
    });
  }

  if (userTryingToDelete.id !== notificationFound.recipient_id) {
    throw new UnprocessableEntityError({
      message: `Você não pode realizar esta operação em notificações de outros usuários.`,
      action: 'Realize esta operação em suas próprias notificações.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:OWN_NOTIFICATION',
      key: 'notifications',
    });
  }

  const notificationUpdate = await webNotifyQueries.updateOneStatusById(`draft`, request.query.id);

  return response.status(200).json(notificationUpdate);
}
