import { createRouter } from 'next-connect';

import { ForbiddenError, ValidationError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import event from 'models/event';
import recovery from 'models/recovery.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .post(postValidationHandler, postHandler)
  .patch(patchValidationHandler, patchHandler)
  .handler(controller.handlerOptions);

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    username: 'optional',
    email: 'optional',
  });

  request.body = cleanValues;

  return next();
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

  let tokenObject;
  try {
    tokenObject = await recovery.createAndSendRecoveryEmail(validatedInputValues);
  } catch (error) {
    if (error instanceof ValidationError && error.key === 'email') {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 15);

      tokenObject = {
        used: false,
        expires_at: expiresAt,
        created_at: now,
        updated_at: now,
      };
    } else {
      throw error;
    }
  }

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToRecover, 'read:recovery_token', tokenObject);

  return response.status(201).json(authorizedValuesToReturn);
}

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
    password: 'required',
  });

  request.body = cleanValues;

  return next();
}

async function patchHandler(request, response) {
  const userTryingToRecover = request.context.user;
  const validatedInputValues = request.body;

  const tokenObject = await recovery.resetUserPassword(validatedInputValues);

  await event.create({
    type: 'update:user',
    originator_user_id: request.context.user.id,
    originator_ip: request.context.clientIp,
    metadata: {
      id: tokenObject.user_id,
      updatedFields: ['password'],
    },
  });

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToRecover, 'read:recovery_token', tokenObject);

  return response.status(200).json(authorizedValuesToReturn);
}
