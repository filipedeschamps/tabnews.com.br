import { createRouter } from 'next-connect';

import { ForbiddenError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import encryption from 'models/encryption';
import event from 'models/event';
import otp from 'models/otp';
import recovery from 'models/recovery.js';
import user from 'models/user';
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
    totp: 'optional',
  });

  request.body = cleanValues;

  return next();
}

async function patchHandler(request, response) {
  const userTryingToRecover = request.context.user;
  const validatedInputValues = request.body;

  const recoveryToken = await recovery.findOneValidTokenById(validatedInputValues.token_id);
  const targetUser = await user.findOneById(recoveryToken.user_id);

  if (targetUser.totp_secret) {
    if (!validatedInputValues.totp) {
      throw new ForbiddenError({
        message: 'Duplo fator de autenticação habilitado para a conta.',
        action: 'Refaça a requisição enviando o código TOTP.',
        errorLocationCode: 'CONTROLLER:RECOVERY:PATCH_HANDLER:TOTP_NOT_DEFINED',
      });
    }
    if (!otp.validateTotp(encryption.decryptData(targetUser.totp_secret), validatedInputValues.totp)) {
      throw new ForbiddenError({
        message: 'O código TOTP informado é inválido.',
        action: 'Verifique o código TOTP e tente novamente.',
        errorLocationCode: 'CONTROLLER:RECOVERY:PATCH_HANDLER:TOTP_INVALID',
      });
    }
  }

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
