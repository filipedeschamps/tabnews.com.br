import nextConnect from 'next-connect';

import { ValidationError } from 'errors';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import controller from 'models/controller.js';
import user from 'models/user';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .post(authorization.canRequest('auth:2fa:confirm'), postVerifier, postHandler);
function postVerifier(req, res, next) {
  if (!('code' in req.body)) {
    throw new ValidationError({
      message: '`code` não foi enviado',
      action: 'Envie um numero de 6 digitos.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:VALIDATOR:FINAL_SCHEMA',
    });
  }
  if (typeof req.body.code != 'string') {
    throw new ValidationError({
      message: '`code` precisa ser uma string',
      action: 'Envie um código válido',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:VALIDATOR:FINAL_SCHEMA',
    });
  }
  next();
}
async function postHandler(req, res) {
  const authenticatedUser = req.context.user;
  await user.confirm_2fa(authenticatedUser, req.body.code);
  return res.status(200).json({ message: 'O 2FA foi ativado com sucesso!' });
}
