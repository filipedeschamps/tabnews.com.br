import crypto from 'crypto';
import cookie from 'cookie';
import database from 'infra/database.js';
import { UnauthorizedError } from 'errors/index.js';

async function create(userId) {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const query = {
    text: `INSERT INTO sessions (id, user_id, expires_at)
               VALUES($1, $2, now() + interval '30 days') RETURNING *;`,
    values: [sessionToken, userId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

function setSessionIdCookie(sessionId, response) {
  response.setHeader('Set-Cookie', [
    cookie.serialize('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    }),
  ]);
}

async function findOneValidById(sessionId) {
  const query = {
    text: `SELECT * FROM sessions WHERE id = $1 AND expires_at > now();`,
    values: [sessionId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function findOneById(sessionId) {
  const query = {
    text: `SELECT * FROM sessions WHERE id = $1;`,
    values: [sessionId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function findOneFromRequest(request) {
  const sessionId = request.cookies?.session_id;

  if (!sessionId) {
    throw new UnauthorizedError({
      message: `Usuário não possui sessão ativa.`,
      action: `Verifique se este usuário está logado.`,
    });
  }

  const sessionObject = await findOneValidById(sessionId);

  if (!sessionObject) {
    throw new UnauthorizedError({
      message: `Usuário não possui sessão ativa.`,
      action: `Verifique se este usuário está logado.`,
    });
  }

  return sessionObject;
}

async function renew(sessionId, response) {
  renewSessionCookieInResponse(sessionId, response);
  const sessionObjectRenewed = await renewObjectInDatabase(sessionId);

  return sessionObjectRenewed;

  function renewSessionCookieInResponse(sessionId, response) {
    setSessionIdCookie(sessionId, response);
  }

  async function renewObjectInDatabase(sessionId) {
    const query = {
      text: `UPDATE sessions SET
              expires_at = now() + interval '30 days',
              updated_at = now()
            WHERE id = $1
            RETURNING *;`,
      values: [sessionId],
    };

    const results = await database.query(query);
    return results.rows[0];
  }
}

export default Object.freeze({
  create,
  setSessionIdCookie,
  findOneValidById,
  findOneById,
  findOneFromRequest,
  renew,
});
