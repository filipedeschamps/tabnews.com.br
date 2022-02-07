import setCookieParser from 'set-cookie-parser';
import session from 'models/session.js';
import user from 'models/user.js';
import authorization from 'models/authorization.js';
import password from 'models/password.js';
import { ForbiddenError } from 'errors/index.js';

async function hashPassword(unhashedPassword) {
  return await password.hash(unhashedPassword);
}

async function comparePasswords(providedPassword, passwordHash) {
  const passwordMatches = await password.compare(providedPassword, passwordHash);

  if (!passwordMatches) {
    throw new UnauthorizedError({
      message: `A senha informada não confere com a senha do usuário.`,
      action: `Verifique se a senha informada está correta e tente novamente.`,
      errorUniqueCode: 'MODEL:AUTHENTICATION:COMPARE_PASSWORDS:PASSWORD_MISMATCH',
    });
  }
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectUserUsingSession(request, response, next);
    return;
  }

  const anonymousUser = {
    features: ['read:activation_token', 'create:session', 'read:user', 'create:user', 'read:users'],
  };

  if (request.context) {
    request.context.user = anonymousUser;
  } else {
    request.context = {
      user: anonymousUser,
    };
  }

  return next();
}

async function injectUserUsingSession(request, response, next) {
  const sessionObject = await session.findOneValidFromRequest(request);
  const userObject = await user.findOneById(sessionObject.user_id);

  if (!authorization.can(userObject, 'read:session')) {
    throw new ForbiddenError({
      message: `Você não possui permissão para executar esta ação.`,
      action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".`,
      errorUniqueCode: 'MODEL:AUTHENTICATION:INJECT_USER_USING_SESSION:USER_CANT_READ_SESSION',
    });
  }

  const sessionRenewed = await session.renew(sessionObject.id, response);

  if (request.context) {
    request.context.user = userObject;
    request.context.session = sessionRenewed;
  } else {
    request.context = {
      user: userObject,
      session: sessionRenewed,
    };
  }

  return next();
}

//TODO: this should be here or inside the session model?
function parseSetCookies(response) {
  const setCookieHeaderValues = response.headers.raw()['set-cookie'];
  const parsedCookies = setCookieParser.parse(setCookieHeaderValues, { map: true });
  return parsedCookies;
}

async function createSessionAndSetCookies(userId, response) {
  const sessionObject = await session.create(userId);
  session.setSessionIdCookieInResponse(sessionObject.token, response);
  return sessionObject;
}

export default Object.freeze({
  hashPassword,
  comparePasswords,
  injectAnonymousOrUser,
  parseSetCookies,
  createSessionAndSetCookies,
});
