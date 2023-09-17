import setCookieParser from 'set-cookie-parser';

import { ForbiddenError, UnauthorizedError } from 'errors';
import authorization from 'models/authorization.js';
import password from 'models/password.js';
import session from 'models/session.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

async function hashPassword(unhashedPassword) {
  return await password.hash(unhashedPassword);
}

async function comparePasswords(providedPassword, passwordHash) {
  const passwordMatches = await password.compare(providedPassword, passwordHash);

  if (!passwordMatches) {
    throw new UnauthorizedError({
      message: `A senha informada não confere com a senha do usuário.`,
      action: `Verifique se a senha informada está correta e tente novamente.`,
      errorLocationCode: 'MODEL:AUTHENTICATION:COMPARE_PASSWORDS:PASSWORD_MISMATCH',
    });
  }
}

async function injectAnonymousOrUser(request, response, next, options = {}) {
  if (request.cookies?.session_id) {
    const cleanCookies = validator(request.cookies, {
      session_id: 'required',
    });
    request.cookies.session_id = cleanCookies.session_id;

    await injectAuthenticatedUser(request, response, options);
    return next();
  } else {
    injectAnonymousUser(request);
    return next();
  }

  async function injectAuthenticatedUser(request, response, options = {}) {
    const sessionObject = await session.findOneValidFromRequest(request);
    const userObject = await user.findOneById(sessionObject.user_id, options);

    if (!authorization.can(userObject, 'read:session')) {
      throw new ForbiddenError({
        message: `Você não possui permissão para executar esta ação.`,
        action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".`,
        errorLocationCode: 'MODEL:AUTHENTICATION:INJECT_AUTHENTICATED_USER:USER_CANT_READ_SESSION',
      });
    }

    request.context = {
      ...request.context,
      user: userObject,
      session: sessionObject,
    };
  }

  function injectAnonymousUser(request) {
    const anonymousUser = user.createAnonymous();
    request.context = {
      ...request.context,
      user: anonymousUser,
    };
  }
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
