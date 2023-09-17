import nextConnect from 'next-connect';
import speakeasy from 'speakeasy';

import { ForbiddenError, UnauthorizedError } from 'errors';
import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import session from 'models/session';
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
  .delete(authorization.canRequest('read:session'), deleteHandler)
  .post(postValidationHandler, authorization.canRequest('create:session'), postHandler);

async function deleteHandler(request, response) {
  const authenticatedUser = request.context.user;
  const sessionObject = request.context.session;

  const expiredSession = await session.expireById(sessionObject.id);
  session.clearSessionIdCookie(response);

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:session', expiredSession);

  return response.status(200).json(secureOutputValues);
}

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    email: 'required',
    password: 'required',
    code_2fa: 'optional',
  });

  request.body = cleanValues;

  next();
}

async function postHandler(request, response) {
  const userTryingToCreateSession = request.context.user;
  const insecureInputValues = request.body;

  const secureInputValues = authorization.filterInput(userTryingToCreateSession, 'create:session', insecureInputValues);

  // Compress all mismatch errors (email and password) into one single error.
  let storedUser;
  try {
    storedUser = await user.findOneByEmail(secureInputValues.email);
    await authentication.comparePasswords(secureInputValues.password, storedUser.password);
  } catch (error) {
    throw new UnauthorizedError({
      message: `Dados não conferem.`,
      action: `Verifique se os dados enviados estão corretos.`,
      errorLocationCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
    });
  }
  if (authorization.can(storedUser, 'auth:2fa') && !secureInputValues.code_2fa) {
    throw new UnauthorizedError({
      message: '2FA está ativado, mas nenhum código foi enviado.',
      action: `Envie um código de 2FA.`,
      errorLocationCode: 'MODEL:AUTHENTICATION:VERIFY_2FA:CODE_NOT_PRESENT',
    });
  }
  if (
    authorization.can(storedUser, 'auth:2fa') &&
    !speakeasy.totp.verify({
      secret: storedUser.secret_2fa,
      token: secureInputValues.code_2fa,
      encoding: 'base32',
    })
  ) {
    throw new UnauthorizedError({
      message: 'O código 2FA não confere.',
      action: `Verifique o código e tente novamente.`,
      errorLocationCode: 'MODEL:AUTHENTICATION:VERIFY_2FA:CODE_MISMATCH',
    });
  }

  if (!authorization.can(storedUser, 'create:session') && authorization.can(storedUser, 'read:activation_token')) {
    await activation.createAndSendActivationEmail(storedUser);
    throw new ForbiddenError({
      message: `O seu usuário ainda não está ativado.`,
      action: `Verifique seu email, pois acabamos de enviar um novo convite de ativação.`,
      errorLocationCode: 'CONTROLLER:SESSIONS:POST_HANDLER:USER_NOT_ACTIVATED',
    });
  }

  if (!authorization.can(storedUser, 'create:session')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para fazer login.`,
      action: `Verifique se este usuário possui a feature "create:session".`,
      errorLocationCode: 'CONTROLLER:SESSIONS:POST_HANDLER:CAN_NOT_CREATE_SESSION',
    });
  }

  const sessionObject = await authentication.createSessionAndSetCookies(storedUser.id, response);
  const secureOutputValues = authorization.filterOutput(storedUser, 'create:session', sessionObject);

  return response.status(201).json(secureOutputValues);
}
