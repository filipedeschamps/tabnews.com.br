import nextConnect from 'next-connect';

import { ForbiddenError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import totp from 'models/totp';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .post(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    postValidationHandler,
    authorization.canRequest('read:session'),
    postHandler,
  );

function postValidationHandler(request, response, next) {
  const cleanBodyValues = validator(request.body, {
    totp_secret: 'required',
    totp_token: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function postHandler(request, response) {
  const token = request.body.totp_token;
  const decryptedSecret = request.body.totp_secret;

  const isTokenValid = totp.validateOTP(decryptedSecret, token);

  if (!isTokenValid) {
    throw new ForbiddenError({
      message: 'Código informado inválido.',
      action: 'Verifique se o horário do seu aplicativo está sincronizado e tente novamente.',
      errorLocationCode: 'CONTROLLER:MFA:TOTP:VERIFY:USER_INVALID_TOTP_CODE',
    });
  }
  response.status(204).end();
}
