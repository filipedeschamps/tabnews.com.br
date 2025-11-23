import { createRouter } from 'next-connect';

import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from 'errors';
import logger from 'infra/logger';
import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import session from 'models/session';
import user from 'models/user';
import userTotp from 'models/user-totp';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .delete(authorization.canRequest('read:session'), deleteHandler)
  .post(postValidationHandler, authorization.canRequest('create:session'), postHandler)
  .handler(controller.handlerOptions);

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
    totp_token: 'optional',
  });

  request.body = cleanValues;

  return next();
}

const ENUMERATION_DELAY_MS = parseInt(process.env.ENUMERATION_DELAY_MS) || 0;

async function postHandler(request, response) {
  const startMs = Date.now();

  const userTryingToCreateSession = request.context.user;
  const insecureInputValues = request.body;

  const secureInputValues = authorization.filterInput(userTryingToCreateSession, 'create:session', insecureInputValues);

  // Compress all mismatch errors (email, password and TOTP) into one single error.
  let storedUser;
  try {
    storedUser = await user.findOneByEmail(secureInputValues.email);
    await authentication.comparePasswords(secureInputValues.password, storedUser.password);

    if (storedUser.totp_secret) {
      validator(secureInputValues, { totp_token: 'required' });
      userTotp.validateToken(storedUser.totp_secret, secureInputValues.totp_token);
    }
  } catch (error) {
    const remainingMs = startMs - Date.now() + ENUMERATION_DELAY_MS + Math.random() * 10;

    if (remainingMs < 0 && process.env.NODE_ENV === 'production') {
      logger.warn({
        message: `ENUMERATION_DELAY_MS (${ENUMERATION_DELAY_MS}ms) pode estar muito baixo. O tempo de processamento da requisição foi de ${Date.now() - startMs}ms.`,
        error_location_code: 'CONTROLLER:SESSIONS:POST_HANDLER:ENUMERATION_DELAY_MS_TOO_LOW',
      });
    }

    await new Promise((resolve) => setTimeout(resolve, remainingMs));

    if (
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      (error instanceof ValidationError && error.errorLocationCode.startsWith('MODEL:USER_TOTP:'))
    ) {
      throw new UnauthorizedError({
        message: `Dados não conferem.`,
        action: `Verifique se os dados enviados estão corretos.`,
        errorLocationCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
      });
    }

    throw error;
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
