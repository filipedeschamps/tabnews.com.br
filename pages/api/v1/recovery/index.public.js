import nextConnect from 'next-connect';

import { ForbiddenError, ValidationError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import otp from 'models/otp';
import recovery from 'models/recovery.js';
import user from 'models/user';
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
    totp: 'optional',
  });

  request.body = cleanValues;

  next();
}

async function patchHandler(request, response) {
  const userTryingToRecover = request.context.user;
  const validatedInputValues = request.body;

  const recoveryToken = await recovery.findOneTokenById(validatedInputValues.token_id);
  const targetUser = await user.findOneById(recoveryToken.user_id);

  if (targetUser.totp_secret) {
    if (!validatedInputValues.totp) {
      throw new ForbiddenError({
        message: 'Duplo fator de autenticação habilitado para a conta.',
        action: 'Refaça a requisição enviando o código TOTP.',
        errorLocationCode: 'CONTROLLER:RECOVERY:PATCH_HANDLER:MFA:TOTP:TOKEN_NOT_SENT',
      });
    }
    if (!otp.validateUserTotp(targetUser.totp_secret, validatedInputValues.totp)) {
      throw new ForbiddenError({
        message: 'O código TOTP informado é inválido.',
        action: 'Verifique o código TOTP e tente novamente.',
        errorLocationCode: 'CONTROLLER:RECOVERY:PATCH_HANDLER:MFA:TOTP:INVALID_CODE',
      });
    }
  }

  const tokenObject = await recovery.resetUserPassword(validatedInputValues);

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToRecover, 'read:recovery_token', tokenObject);

  return response.status(200).json(authorizedValuesToReturn);
}
