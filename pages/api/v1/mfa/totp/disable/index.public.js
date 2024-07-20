import nextConnect from 'next-connect';

import { ForbiddenError, ValidationError } from 'errors';
import database from 'infra/database';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import event from 'models/event.js';
import user from 'models/user';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .patch(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    patchValidationHandler,
    authorization.canRequest('update:user'),
    patchHandler,
  );

function patchValidationHandler(request, response, next) {
  const cleanBodyValues = validator(request.body, {
    username: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const targetUsername = request.body.username;

  if (userTryingToPatch.username !== targetUsername && !authorization.can(userTryingToPatch, 'update:user:others')) {
    throw new ForbiddenError({
      message: 'Você não possui permissão para desabilitar TOTP de outro usuário.',
      action: 'Verifique se você recebeu a feature "update:user:others".',
      errorLocationCode: 'CONTROLLER:MFA:TOTP:ENABLE:USER_NOT_ALLOWED_DISABLE_TOTP_TO_OTHER_USER',
    });
  }

  const targetUser = await user.findOneByUsername(targetUsername);
  if (!targetUser.totp_enabled) {
    throw new ValidationError({
      message: 'O duplo fator de autenticação já está desativado para o usuário informado.',
      action: 'Verifique se você informou o usuário correto.',
      errorLocationCode: 'CONTROLLER:MFA:TOTP:ENABLE:TOTP_ALREADY_DISABLED_TO_USER',
    });
  }

  const inputValues = { totp_enabled: false, totp_secret: ' ' };

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    await event.create(
      {
        type: 'update:user',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
      },
      {
        transaction: transaction,
      },
    );

    await user.update(targetUsername, inputValues, {
      transaction: transaction,
    });

    await transaction.query('COMMIT');
    await transaction.release();

    return response.status(200).json({ message: 'O TOTP foi desativado com sucesso.' });
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }
}
