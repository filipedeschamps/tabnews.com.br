import { ForbiddenError, UnauthorizedError } from 'errors';
import authorization from 'models/authorization.js';
import controller from 'models/controller.js';
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
    rejectUnsafeCookieRequest(request);

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
    const sessionObject = await session.findOneValidFromRequest(request, response);
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

const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

// CSRF defense for cookie-authenticated requests. Non-browser clients do not send
// "Origin" or "Sec-Fetch-Site", so they keep working.
function rejectUnsafeCookieRequest(request) {
  if (safeMethods.includes(request.method)) return;

  if (isCrossOriginRequest(request)) {
    throw new ForbiddenError({
      message: 'Requisições autenticadas por cookie não podem ser feitas a partir de outra origem.',
      action: 'Faça a requisição a partir da mesma origem da API.',
      errorLocationCode: 'MODEL:AUTHENTICATION:REJECT_UNSAFE_COOKIE_REQUEST:CROSS_ORIGIN',
    });
  }

  controller.assertJsonContentType(request);
}

function isCrossOriginRequest(request) {
  const secFetchSite = request.headers['sec-fetch-site'];

  if (secFetchSite) {
    return secFetchSite !== 'same-origin' && secFetchSite !== 'none';
  }

  const origin = request.headers.origin;

  if (!origin) return false;

  try {
    return new URL(origin).host !== request.headers.host;
  } catch {
    return true;
  }
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
  createSessionAndSetCookies,
});
