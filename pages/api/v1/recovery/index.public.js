import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import recovery from 'models/recovery.js';
import validator from 'models/validator.js';
import { ForbiddenError } from 'errors';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .post(postValidationHandler, postHandler)
  .patch(patchValidationHandler, patchHandler);

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    username: 'optional',
    email: 'optional',
  });

  request.body = cleanValues;

  next();
}

async function postHandler(request, response) {
  const userTryingToRecover = request.context.user;
  const validatedInputValues = request.body;

  if (validatedInputValues.username && !authorization.can(userTryingToRecover, 'create:recovery_token:username')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para criar um token de recuperação com username.`,
      action: `Verifique se este usuário tem a feature "create:recovery_token:username".`,
      errorLocationCode: 'CONTROLLER:RECOVERY:POST_HANDLER:CAN_NOT_CREATE_RECOVERY_TOKEN_USERNAME',
    });
  }

  const tokenObject = await recovery.createAndSendRecoveryEmail(validatedInputValues);

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToRecover, 'read:recovery_token', tokenObject);

  return response.status(201).json(authorizedValuesToReturn);
}

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
    password: 'required',
  });

  request.body = cleanValues;

  next();
}

async function patchHandler(request, response) {
  const userTryingToRecover = request.context.user;
  const validatedInputValues = request.body;

  const tokenObject = await recovery.resetUserPassword(validatedInputValues);

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToRecover, 'read:recovery_token', tokenObject);

  return response.status(200).json(authorizedValuesToReturn);
}
