import crypto from 'crypto';
import cookie from 'cookie';
import Joi from 'joi';
import database from 'infra/database.js';
import { UnauthorizedError, ValidationError } from 'errors/index.js';

async function create(userId) {
  const sessionToken = crypto.randomBytes(48).toString('hex');

  const query = {
    text: `INSERT INTO sessions (token, user_id, expires_at)
               VALUES($1, $2, now() + interval '30 days') RETURNING *;`,
    values: [sessionToken, userId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function validatePostSchema(postedSessionData) {
  const schema = Joi.object({
    email: Joi.string().email().min(7).max(254).lowercase().trim().required().messages({
      'any.required': `"email" é um campo obrigatório.`,
      'string.empty': `"email" não pode estar em branco.`,
      'string.base': `"email" deve ser do tipo String.`,
      'string.email': `"email" deve conter um email válido.`,
    }),
    // Why 72 in max length? https://security.stackexchange.com/a/39851
    password: Joi.string().min(8).max(72).trim().required().messages({
      'any.required': `"password" é um campo obrigatório.`,
      'string.empty': `"password" não pode estar em branco.`,
      'string.base': `"password" deve ser do tipo String.`,
      'string.min': `"password" deve conter no mínimo {#limit} caracteres.`,
      'string.max': `"password" deve conter no máximo {#limit} caracteres.`,
    }),
  });

  const { error, value } = schema.validate(postedSessionData, { stripUnknown: true });

  if (error) {
    throw new ValidationError({ message: error.details[0].message, stack: new Error().stack });
  }

  return value;
}

function setSessionIdCookieInResponse(sessionToken, response) {
  response.setHeader('Set-Cookie', [
    cookie.serialize('session_id', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    }),
  ]);
}

// TODO: mark session as invalid also in Database.
function clearSessionIdCookie(response) {
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
  validatePostSchema,
  setSessionIdCookieInResponse,
  clearSessionIdCookie,
  findOneValidByToken,
  findOneById,
  findOneValidFromRequest,
  renew,
});
