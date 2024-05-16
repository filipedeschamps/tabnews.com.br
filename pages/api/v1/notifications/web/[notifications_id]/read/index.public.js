import nextConnect from 'next-connect';

import { NotFoundError, UnprocessableEntityError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import { NotificationWebManage } from 'models/notifications';
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
  .post(postValidationHandler, authorization.canRequest('update:user'), postHandler);

function postValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    notifications_id: 'required',
  });

  request.query = cleanQueryValues;

  next();
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;

  const notificationFound = await NotificationWebManage.findOneById(request.query.notifications_id);

  if (!notificationFound) {
    throw new NotFoundError({
      message: `A notificação informada não foi encontrada no sistema.`,
      action: 'Verifique se o "id" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATION_NOT_FOUND',
      key: 'id',
    });
  }

  if (notificationFound.status == 'read') {
    throw new NotFoundError({
      message: `A notificação informada já foi lida.`,
      action: 'Verifique o status da notificação.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:NOTIFICATION_ALREADY_READ',
      key: 'status',
    });
  }

  if (userTryingToPost.id !== notificationFound.to_id) {
    throw new UnprocessableEntityError({
      message: `Você não pode realizar esta operação em notificações de outros usuários.`,
      action: 'Realize esta operação em suas próprias notificações.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:NOTIFICATION:OWN_NOTIFICATION',
      key: 'notifications',
    });
  }

  const notificationUpdate = await NotificationWebManage.updateStatusToReadById(request.query.notifications_id);

  return response.status(200).json(notificationUpdate);
}
