import authentication from 'models/authentication';
import authorization from 'models/authorization';
import controller from 'models/controller';
import notification from 'models/notification';
import nextConnect from 'next-connect';
import { UnauthorizedError } from 'errors/index';
import validator from 'models/validator';
import content from 'models/content';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getHandler);

function getValidationHandler(request, response, next) {
  if (!request.query) {
    next();

    return;
  }

  if (Object.entries(request.query).length === 0) {
    next();

    return;
  }

  const cleanValues = validator(request.query, {
    get_content: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  if (!userTryingToList.id) {
    throw new UnauthorizedError({
      message: 'Usuário não autenticado.',
      action: 'Verifique se você está autenticado com uma sessão ativa e tente novamente.',
      errorUniqueCode: 'CONTROLLER:NOTIFICATION:GET_HANDLER:NOT_AUTHENTICATED',
    });
  }

  const notificationList = await notification.findWithStrategy({
    strategy: 'descending',
    where: {
      receiver_id: userTryingToList.id,
    },
  });

  let contentList = [];

  if (request.query.get_content) {
    notificationList.map((currentNotification) => {
      if (currentNotification.content_id) {
        contentList.push(content.findChildren({ where: { id: currentNotification.content_id } }));
      }
    });
  }

  const filteredNotificationOutputValues = await notificationList.map((notification) => {
    return validator(notification, {
      id: 'required',
      content_id: 'optional',
      type: 'required',
      created_at: 'required',
    });
  });

  const filteredContentOutputValues = await contentList.map((content) => {
    return validator(content, {
      content: 'required',
    });
  });

  response.setHeader('Cache-Control', 'public, s-maxage=3, stale-while-revalidate');
  return response
    .status(200)
    .json({ notifications: filteredNotificationOutputValues, contents: filteredContentOutputValues });
}
