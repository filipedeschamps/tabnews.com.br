import email from 'infra/email.js';
import database from 'infra/database.js';
import webserver from 'infra/webserver.js';
import user from 'models/user.js';
import { NotFoundError } from 'errors/index.js';

async function createAndSendEmail(userId, newEmail) {
  const userFound = await user.findOneById(userId);
  const tokenObject = await create(userFound.id, newEmail);
  await sendEmailToUser(userFound, newEmail, tokenObject.id);

  return tokenObject;
}

async function create(userId, newEmail) {
  const query = {
    text: `
      INSERT INTO
        email_confirmation_tokens (user_id, email, expires_at)
      VALUES
        ($1, $2, now() + interval '15 minutes')
      RETURNING
        *
      ;`,
    values: [userId, newEmail],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function sendEmailToUser(user, newEmail, tokenId) {
  const emailConfirmationPageEndpoint = getEmailConfirmationPageEndpoint(tokenId);

  await email.send({
    from: {
      name: 'TabNews',
      address: 'contato@tabnews.com.br',
    },
    to: newEmail,
    subject: 'Confirme seu novo email',
    text: `${user.username}, uma alteração de email foi solicitada.

Clique no link abaixo para confirmar esta alteração:

${emailConfirmationPageEndpoint}

Atenciosamente,
Equipe TabNews
Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500`,
  });
}

function getEmailConfirmationPageEndpoint(tokenId) {
  const webserverHost = webserver.getHost();
  return `${webserverHost}/perfil/confirmar-email/${tokenId}`;
}

async function findOneTokenById(tokenId) {
  const query = {
    text: `
      SELECT
        *
      FROM
        email_confirmation_tokens
      WHERE
        id = $1
      LIMIT 1
    ;`,
    values: [tokenId],
  };
  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O token de confirmação de email utilizado não foi encontrado no sistema.`,
      action: 'Certifique-se que está sendo enviado o token corretamente.',
      errorLocationCode: 'MODEL:EMAIL_CONFIRMATION:FIND_ONE_TOKEN_BY_ID:NOT_FOUND',
      stack: new Error().stack,
    });
  }

  return results.rows[0];
}

async function findOneValidTokenById(tokenId) {
  const query = {
    text: `
      SELECT
        *
      FROM
        email_confirmation_tokens
      WHERE
        id = $1
        AND used = false
        AND expires_at >= now()
      LIMIT
        1
    ;`,
    values: [tokenId],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O token de confirmação de email utilizado não foi encontrado no sistema ou expirou.`,
      action: 'Solicite uma nova alteração de email.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:EMAIL_CONFIRMATION:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
      key: 'token_id',
    });
  }

  return results.rows[0];
}

async function findOneTokenByUserId(userId) {
  const query = {
    text: `
      SELECT
        *
      FROM
        email_confirmation_tokens
      WHERE
        user_id = $1
      LIMIT
        1
    ;`,
    values: [userId],
  };
  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O token de recuperação de senha utilizado não foi encontrado no sistema.`,
      action: 'Certifique-se que está sendo enviado o token corretamente.',
      stack: new Error().stack,
    });
  }

  return results.rows[0];
}

async function markTokenAsUsed(tokenId) {
  const query = {
    text: `
      UPDATE
        email_confirmation_tokens
      SET
        used = true,
        updated_at = (now() at time zone 'utc')
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [tokenId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function updateUserEmail(userId, newEmail) {
  const currentUser = await user.findOneById(userId);

  await user.update(
    currentUser.username,
    {
      email: newEmail,
    },
    {
      skipEmailConfirmation: true,
    }
  );
}

async function confirmEmailUpdate(tokenId) {
  const tokenObject = await findOneTokenById(tokenId);

  if (!tokenObject.used) {
    const validToken = await findOneValidTokenById(tokenId);
    const usedToken = await markTokenAsUsed(validToken.id);
    await updateUserEmail(validToken.user_id, validToken.email);
    return usedToken;
  }

  return tokenObject;
}

async function update(tokenId, tokenBody) {
  const currentToken = await findOneTokenById(tokenId);
  const updatedToken = { ...currentToken, ...tokenBody };

  const query = {
    text: `
      UPDATE
        email_confirmation_tokens
      SET
        user_id = $2,
        used = $3,
        email = $4,
        expires_at = $5,
        created_at = $6,
        updated_at = $7
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [
      tokenId,
      updatedToken.user_id,
      updatedToken.used,
      updatedToken.email,
      updatedToken.expires_at,
      updatedToken.created_at,
      updatedToken.updated_at,
    ],
  };

  const results = await database.query(query);

  return results.rows[0];
}

export default Object.freeze({
  create,
  createAndSendEmail,
  findOneTokenByUserId,
  getEmailConfirmationPageEndpoint,
  confirmEmailUpdate,
  update,
});
