import { createRouter } from 'next-connect';

import { ForbiddenError, UnauthorizedError, ValidationError } from 'errors';
import database from 'infra/database';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import event from 'models/event';
import recovery from 'models/recovery.js';
import userTotp from 'models/user-totp';
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

  const tokenObject = await recovery.requestPasswordRecovery(validatedInputValues);

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToRecover, 'read:recovery_token', tokenObject);

  return response.status(201).json(authorizedValuesToReturn);
}

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
    password: 'required',
    totp_token: 'optional',
  });

  request.body = cleanValues;

  return next();
}

async function patchHandler(request, response) {
  const userTryingToRecover = request.context.user;
  const validatedInputValues = request.body;

  let tokenObject;
  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    tokenObject = await recovery.resetUserPassword(validatedInputValues, { transaction });
    const targetUser = tokenObject.user;

    if (targetUser.totp_secret) {
      validator(validatedInputValues, { totp_token: 'required' });
      userTotp.validateToken(targetUser.totp_secret, validatedInputValues.totp_token);
    }

    await event.create(
      {
        type: 'update:user',
        originator_user_id: request.context.user.id,
        originator_ip: request.context.clientIp,
        metadata: {
          id: tokenObject.user_id,
          updatedFields: ['password'],
        },
      },
      { transaction },
    );
    await transaction.query('COMMIT');
  } catch (error) {
    await transaction.query('ROLLBACK');

    if (error instanceof ValidationError && error.errorLocationCode.startsWith('MODEL:USER_TOTP:')) {
      throw new UnauthorizedError({
        message: `O código TOTP informado é inválido.`,
        action: `Verifique o código e tente novamente.`,
        errorLocationCode: 'CONTROLLER:RECOVERY:PATCH_HANDLER:TOTP_INVALID',
      });
    }

    throw error;
  } finally {
    await transaction.release();
  }

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToRecover, 'read:recovery_token', tokenObject);

  return response.status(200).json(authorizedValuesToReturn);
}
