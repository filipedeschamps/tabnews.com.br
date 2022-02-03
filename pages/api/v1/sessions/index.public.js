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
  .get(authentication.injectUserUsingSession, getHandler)
  .post(authentication.injectAnonymousOrUser, postHandler);

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

  await checkIfPasswordsMatch(authorizedValuesFromInput.password, storedUserTryingToCreateSession.password);

  if (!authorization.can(storedUserTryingToCreateSession, 'create:session')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para fazer login.`,
      action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "create:session".`,
    });
  }

  const sessionObject = await createSessionAndSetCookies(storedUserTryingToCreateSession.id, response);

  const authorizedValuesToReturn = authorization.filterOutput(
    storedUserTryingToCreateSession,
    'create:session',
    sessionObject
  );

  return response.status(201).json(authorizedValuesToReturn);

  async function checkIfPasswordsMatch(providedPassword, storedPassword) {
    const passwordMatches = await authentication.comparePasswords(providedPassword, storedPassword);

    if (!passwordMatches) {
      throw new UnauthorizedError({
        message: `A senha informada não confere com a senha do usuário.`,
        action: `Verifique se a senha informada está correta e tente novamente.`,
      });
    }
  }

  async function createSessionAndSetCookies(userId, response) {
    const sessionObject = await session.create(userId);
    session.setSessionIdCookieInResponse(sessionObject.token, response);
    return sessionObject;
  }
}
