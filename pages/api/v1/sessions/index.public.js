import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import session from 'models/session.js';
import user from 'models/user';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import { UnauthorizedError, ForbiddenError } from '/errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .get(authorization.canRequest('read:session'), getHandler)
  .post(authorization.canRequest('create:session'), postHandler);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;
  const sessionObject = request.context.session;
  const authorizedValuesToReturn = authorization.filterOutput(authenticatedUser, 'read:session', sessionObject);

  return response.status(200).json(authorizedValuesToReturn);
}

async function postHandler(request, response) {
  const userTryingToCreateSession = request.context.user;
  const insecureValuesFromClient = request.body;

  const authorizedValuesFromInput = authorization.filterInput(
    userTryingToCreateSession,
    'create:session',
    insecureValuesFromClient
  );

  const storedUserTryingToCreateSession = await user.findOneByUsername(authorizedValuesFromInput.username);

  if (!authorization.can(storedUserTryingToCreateSession, 'create:session')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para fazer login.`,
      action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "create:session".`,
    });
  }

  await authentication.comparePasswords(authorizedValuesFromInput.password, storedUserTryingToCreateSession.password);

  const sessionObject = await authentication.createSessionAndSetCookies(storedUserTryingToCreateSession.id, response);

  const authorizedValuesToReturn = authorization.filterOutput(
    storedUserTryingToCreateSession,
    'create:session',
    sessionObject
  );

  return response.status(201).json(authorizedValuesToReturn);
}
