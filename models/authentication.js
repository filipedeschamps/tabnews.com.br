import setCookieParser from 'set-cookie-parser';
import session from 'models/session.js';
import user from 'models/user.js';
import authorization from 'models/authorization.js';
import password from 'models/password.js';

async function hashPassword(unhashedPassword) {
  return await password.hash(unhashedPassword);
}

async function comparePasswords(providedPassword, passwordHash) {
  return await password.compare(providedPassword, passwordHash);
}

async function injectAuthenticatedUser(request, response, next) {
  const sessionObject = await session.findOneValidFromRequest(request);
  const userObject = await user.findOneById(sessionObject.user_id);
  checkIfUserCanReadSession(userObject);
  await session.renew(sessionObject.id, response);

  request.user = userObject;

  return next();

  function checkIfUserCanReadSession(user) {
    if (!authorization.can(user, 'read:session')) {
      throw new ForbiddenError({
        message: `Você não possui permissão para executar esta ação.`,
        action: `Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".`,
      });
    }
  }
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
  injectAuthenticatedUser,
  parseSetCookies,
});
