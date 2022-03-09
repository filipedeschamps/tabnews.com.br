import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import { UnauthorizedError, ForbiddenError } from '/errors/index.js';
import session from 'models/session';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .get(authorization.canRequest('read:session'), getHandler)
  .post(authorization.canRequest('create:session'), postHandler)
  .use(controller.closeDatabaseConnection);

async function getHandler(request, response, next) {
  const authenticatedUser = request.context.user;
  const sessionObject = request.context.session;

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'read:session', sessionObject);

  response.status(200).json(secureOutputValues);
  return next();
}

async function postHandler(request, response, next) {
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

  if (!authorization.can(storedUser, 'create:session')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para fazer login.`,
      action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "create:session".`,
      errorUniqueCode: 'CONTROLLER:SESSIONS:POST_HANDLER:CAN_NOT_CREATE_SESSION',
    });
  }

  const sessionObject = await authentication.createSessionAndSetCookies(storedUser.id, response);

  const secureOutputValues = authorization.filterOutput(storedUser, 'create:session', sessionObject);

  response.status(201).json(secureOutputValues);
  return next();
}
