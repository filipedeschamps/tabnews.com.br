import nextConnect from 'next-connect';

import { ServiceError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import totp from 'models/totp';

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

async function getHandler(request, response) {
  const username = request.context.user.username;

  try {
    const { qrcode_uri, secret } = await totp.createQrCode(username);

    response.status(200).json({ qrcode_uri, secret });
  } catch (err) {
    throw new ServiceError({
      message: 'Não foi possível gerar um QRCode no momento.',
      action: 'Tente novamente mais tarde.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:MFA:TOTP:QRCODE',
      key: 'userId',
    });
  }
}
