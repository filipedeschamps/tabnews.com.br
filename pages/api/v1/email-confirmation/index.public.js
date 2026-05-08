import { createRouter } from 'next-connect';

import { UnauthorizedError, ValidationError } from 'errors';
import database from 'infra/database';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import emailConfirmation from 'models/email-confirmation.js';
import userTotp from 'models/user-totp';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .patch(patchValidationHandler, patchHandler)
  .handler(controller.handlerOptions);

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
    totp_token: 'optional',
  });

  request.body = cleanValues;

  return next();
}

async function patchHandler(request, response) {
  const userTryingToChangeEmail = request.context.user;
  const validatedInputValues = request.body;

  let tokenObject;
  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    tokenObject = await emailConfirmation.confirmEmailUpdate(validatedInputValues.token_id, { transaction });
    const targetUser = tokenObject.user;

    if (targetUser.totp_secret) {
      validator(validatedInputValues, { totp_token: 'required' });
      userTotp.validateToken(targetUser.totp_secret, validatedInputValues.totp_token);
    }

    await transaction.query('COMMIT');
  } catch (error) {
    await transaction.query('ROLLBACK');

    if (error instanceof ValidationError && error.errorLocationCode.startsWith('MODEL:USER_TOTP:')) {
      throw new UnauthorizedError({
        message: `O código TOTP informado é inválido.`,
        action: `Verifique o código e tente novamente.`,
        errorLocationCode: 'CONTROLLER:EMAIL_CONFIRMATION:PATCH_HANDLER:TOTP_INVALID',
      });
    }

    throw error;
  } finally {
    await transaction.release();
  }

  const authorizedValuesToReturn = authorization.filterOutput(
    userTryingToChangeEmail,
    'read:email_confirmation_token',
    tokenObject,
  );

  return response.status(200).json(authorizedValuesToReturn);
}
