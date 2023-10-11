import cookie from 'cookie';
import crypto from 'node:crypto';

import { UnauthorizedError } from 'errors';
import database from 'infra/database.js';
import cacheControl from 'models/cache-control';
import validator from 'models/validator.js';

const SESSION_EXPIRATION_IN_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function create(userId) {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * SESSION_EXPIRATION_IN_SECONDS);

  const query = {
    text: `INSERT INTO sessions (token, user_id, expires_at)
               VALUES($1, $2, $3) RETURNING *;`,
    values: [sessionToken, userId, expiresAt],
  };

  const results = await database.query(query);
  return results.rows[0];
}

function setSessionIdCookieInResponse(sessionToken, response) {
  cacheControl.noCache(undefined, response);
  response.setHeader('Set-Cookie', [
    cookie.serialize('session_id', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_EXPIRATION_IN_SECONDS,
    }),
  ]);
}

async function expireById(id) {
  const query = {
    text: `
      UPDATE
        sessions
      SET
        expires_at = created_at - interval '1 day',
        updated_at = now()
      WHERE
        id = $1
      RETURNING
        *
      ;`,
    values: [id],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function expireAllFromUserId(userId, options = {}) {
  const query = {
    text: `
      UPDATE
        sessions
      SET
        expires_at = created_at - interval '1 day',
        updated_at = now()
      WHERE
        user_id = $1
        AND expires_at >= now()
      RETURNING
        *
      ;`,
    values: [userId],
  };

  const results = await database.query(query, options);
  return results;
}

// TODO: mark session as invalid also in Database.
function clearSessionIdCookie(response) {
  cacheControl.noCache(undefined, response);
  response.setHeader('Set-Cookie', [
    cookie.serialize('session_id', 'invalid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: -1,
    }),
  ]);
}

async function findOneValidByToken(sessionToken) {
  validator(
    {
      session_id: sessionToken,
    },
    {
      session_id: 'required',
    }
  );

  const query = {
    text: `SELECT * FROM sessions WHERE token = $1 AND expires_at > now();`,
    values: [sessionToken],
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

async function findOneValidFromRequest(request) {
  validator(request.cookies, {
    session_id: 'required',
  });

  const sessionToken = request.cookies?.session_id;

  if (!sessionToken) {
    throw new UnauthorizedError({
      message: `Usuário não possui sessão ativa.`,
      action: `Verifique se este usuário está logado.`,
    });
  }

  const sessionObject = await findOneValidByToken(sessionToken);

  if (!sessionObject) {
    throw new UnauthorizedError({
      message: `Usuário não possui sessão ativa.`,
      action: `Verifique se este usuário está logado.`,
    });
  }

  return sessionObject;
}

async function renew(sessionId, response) {
  const sessionObjectRenewed = await renewObjectInDatabase(sessionId);
  setSessionIdCookieInResponse(sessionObjectRenewed.token, response);
  return sessionObjectRenewed;

  async function renewObjectInDatabase(sessionId) {
    const expiresAt = new Date(Date.now() + 1000 * SESSION_EXPIRATION_IN_SECONDS);

    const query = {
      text: `UPDATE sessions SET
              expires_at = $2,
              updated_at = now()
            WHERE id = $1
            RETURNING *;`,
      values: [sessionId, expiresAt],
    };

    const results = await database.query(query);
    return results.rows[0];
  }
}

export default Object.freeze({
  create,
  setSessionIdCookieInResponse,
  expireById,
  expireAllFromUserId,
  clearSessionIdCookie,
  findOneValidByToken,
  findOneById,
  findOneValidFromRequest,
  renew,
});
