import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import { ForbiddenError } from '/errors/index.js';
import session from 'models/session';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .get(authorization.canRequest('session:read'), getHandler)
  .post(authorization.canRequest('session:create'), postHandler);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;
  const sessionObject = request.context.session;

  const secureOutputValues = authorization.filterOutput(authenticatedUser, 'session:read', sessionObject);

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTryingToCreateSession = request.context.user;
  const insecureInputValues = request.body;

  const secureInputValues = authorization.filterInput(userTryingToCreateSession, 'session:create', insecureInputValues);

  await session.validatePostSchema(secureInputValues);

  const storedUser = await user.findOneByEmail(secureInputValues.email);

  if (!authorization.can(storedUser, 'session:create')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para fazer login.`,
      action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "session:create".`,
      errorUniqueCode: 'CONTROLLER:SESSIONS:POST_HANDLER:CAN_NOT_CREATE_SESSION',
    });
  }

  await authentication.comparePasswords(secureInputValues.password, storedUser.password);

  const sessionObject = await authentication.createSessionAndSetCookies(storedUser.id, response);

  const secureOutputValues = authorization.filterOutput(storedUser, 'session:create', sessionObject);

  return response.status(201).json(secureOutputValues);
}
