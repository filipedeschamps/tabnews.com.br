import nextConnect from 'next-connect';

import { ValidationError } from 'errors';
import database from 'infra/database';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import event from 'models/event.js';
import totp from 'models/totp';
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
    totp_secret: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const targetUsername = userTryingToPatch.username;
  const targetUser = await user.findOneByUsername(targetUsername);

  if (targetUser.totp_enabled) {
    throw new ValidationError({
      message: 'Duplo fator de autenticação já habilitado para a conta.',
      action: 'Verifique se você está realizando a operação correta.',
      errorLocationCode: 'CONTROLLER:MFA:TOTP:ENABLE:TOTP_ALREADY_CONFIGURED',
    });
  }

  const { totp_secret } = request.body;
  const encryptedSecret = totp.encryptData(totp_secret);
  const inputValues = { totp_secret: encryptedSecret, totp_enabled: true };

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: 'update:user',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
      },
      {
        transaction: transaction,
      },
    );

    const updatedUser = await user.update(targetUsername, inputValues, {
      transaction: transaction,
    });

    await event.updateMetadata(
      currentEvent.id,
      {
        metadata: getEventMetadata(targetUser, updatedUser),
      },
      {
        transaction: transaction,
      },
    );

    await transaction.query('COMMIT');
    await transaction.release();

    return response.status(200).json({ message: 'O duplo fator de autenticação foi configurado com sucesso.' });
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }

  function getEventMetadata(originalUser, updatedUser) {
    const metadata = {
      id: originalUser.id,
      updatedFields: [],
    };

    const updatableFields = ['totp_enabled', 'totp_secret'];
    for (const field of updatableFields) {
      if (originalUser[field] !== updatedUser[field]) {
        metadata.updatedFields.push(field);
      }
    }

    return metadata;
  }
}
