import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import session from 'models/session.js';
import user from 'models/user';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import { ForbiddenError } from '/errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .get(authentication.injectUserUsingSession, getHandler)
  .post(postHandler);

async function getHandler(request, response) {
  const authenticatedUser = request.context.user;
  const authorizedValuesToReturn = extractAuthorizedValuesToReturn(authenticatedUser);

  return response.status(200).json(authorizedValuesToReturn);

  function extractAuthorizedValuesToReturn(user) {
    const publicValues = {
      id: user.id,
      username: user.username,
      email: user.email,
      features: user.features,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return publicValues;
  }
}

async function postHandler(request, response) {
  const clientPostedData = request.body;
  const authorizedValuesFromClient = await extractAuthorizedValuesFromClient(clientPostedData);
  const storedUserTryingToLogin = await user.findOneByUsername(authorizedValuesFromClient.username);
  await checkIfPasswordsMatch(authorizedValuesFromClient.password, storedUserTryingToLogin.password);
  checkIfUserCanCreateSession(storedUserTryingToLogin);
  const sessionObject = await createSessionAndSetCookies(storedUserTryingToLogin.id, response);
  const authorizedValuesToReturn = extractAuthorizedValuesToReturn(sessionObject);
  return response.status(201).json(authorizedValuesToReturn);

  async function extractAuthorizedValuesFromClient(clientPostedData) {
    const unprivilegedValues = {
      username: clientPostedData.username,
      password: clientPostedData.password,
    };

    return unprivilegedValues;
  }

  function checkIfUserCanCreateSession(user) {
    if (!authorization.can(user, 'create:session')) {
      throw new ForbiddenError({
        message: `Você não possui permissão para fazer login.`,
        action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "create:session".`,
      });
    }
  }

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
    session.setSessionIdCookie(sessionObject.id, response);
    return sessionObject;
  }

  function extractAuthorizedValuesToReturn(sessionObject) {
    const publicValues = {
      session_id: sessionObject.id,
    };

    return publicValues;
  }
}
