import nextConnect from 'next-connect';

import { ServiceError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import otp from 'models/otp';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    authorization.canRequest('read:session'),
    getHandler,
  );

function getHandler(request, response) {
  const username = request.context.user.username;
  const totp = otp.createTotp(null, username);

  try {
    response.status(200).json({ totp: totp.toString() });
  } catch (err) {
    throw new ServiceError({
      message: 'Não foi possível gerar um TOTP no momento.',
      action: 'Tente novamente mais tarde.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:MFA:TOTP:GET_HANDLER:GENERATE_TOTP',
      key: 'totp',
    });
  }
}
