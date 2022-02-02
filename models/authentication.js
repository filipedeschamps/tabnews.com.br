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
  return await password.compare(providedPassword, passwordHash);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectUserUsingSession(request, response, next);
    return;
  }

  const anonymousUser = {
    features: ['create:session', 'read:user'],
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

export default Object.freeze({
  hashPassword,
  comparePasswords,
  injectUserUsingSession,
  injectAnonymousOrUser,
  parseSetCookies,
});
