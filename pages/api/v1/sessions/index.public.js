import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import { UnauthorizedError, ForbiddenError } from '/errors/index.js';
import session from 'models/session';
import activation from 'models/activation.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(authorization.canRequest('read:session'), getHandler)
  .post(authorization.canRequest('create:session'), postHandler);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;
  const sessionObject = request.context.session;

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:session', sessionObject);

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTryingToCreateSession = request.context.user;
  const insecureInputValues = request.body;

  const secureInputValues = authorization.filterInput(userTryingToCreateSession, 'create:session', insecureInputValues);

  await session.validatePostSchema(secureInputValues);

  // Compress all mismatch errors (email and password) into one single error.
  let storedUser;
  try {
    storedUser = await user.findOneByEmail(secureInputValues.email);
    await authentication.comparePasswords(secureInputValues.password, storedUser.password);
  } catch (error) {
    throw new UnauthorizedError({
      message: `Dados não conferem.`,
      action: `Verifique se os dados enviados estão corretos.`,
      errorUniqueCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
    });
  }

  if (!authorization.can(storedUser, 'create:session') && authorization.can(storedUser, 'read:activation_token')) {
    await activation.createAndSendActivationEmail(storedUser);
    throw new ForbiddenError({
      message: `O seu usuário ainda não está ativado.`,
      action: `Verifique seu email, pois acabamos de enviar um novo convite de ativação.`,
      errorUniqueCode: 'CONTROLLER:SESSIONS:POST_HANDLER:USER_NOT_ACTIVATED',
    });
  }

  if (!authorization.can(storedUser, 'create:session')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para fazer login.`,
      action: `Verifique se este usuário possui a feature "create:session".`,
      errorUniqueCode: 'CONTROLLER:SESSIONS:POST_HANDLER:CAN_NOT_CREATE_SESSION',
    });
  }

  const sessionObject = await authentication.createSessionAndSetCookies(storedUser.id, response);

  const secureOutputValues = authorization.filterOutput(storedUser, 'create:session', sessionObject);

  return response.status(201).json(secureOutputValues);
}
