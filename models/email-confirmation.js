import { NotFoundError } from 'errors';
import database from 'infra/database.js';
import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import { ConfirmationEmail } from 'models/transactional';
import user from 'models/user.js';

async function createAndSendEmail(user, newEmail, options) {
  const tokenObject = await create(user.id, newEmail, options);
  await sendEmailToUser(user, newEmail, tokenObject.id);

  return tokenObject;
}

async function create(userId, newEmail, options) {
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

  const results = await database.query(query, options);
  return results.rows[0];
}

async function sendEmailToUser(user, newEmail, tokenId) {
  const emailConfirmationPageEndpoint = getEmailConfirmationPageEndpoint(tokenId);

  const { html, text } = ConfirmationEmail({
    username: user.username,
    confirmationLink: emailConfirmationPageEndpoint,
  });

  await email.send({
    from: {
      name: 'TabNews',
      address: 'contato@tabnews.com.br',
    },
    to: newEmail,
    subject: 'Confirme seu novo email',
    html,
    text,
  });
}

function getEmailConfirmationPageEndpoint(tokenId) {
  return `${webserver.host}/perfil/confirmar-email/${tokenId}`;
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

async function markTokenAsUsedById(tokenId) {
  const query = {
    text: `
      UPDATE
        email_confirmation_tokens
      SET
        used = true,
        updated_at = (now() at time zone 'utc')
      WHERE
        id = $1
        AND used = false
        AND expires_at >= now()
      RETURNING
        *
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

async function confirmEmailUpdate(tokenId) {
  const usedToken = await markTokenAsUsedById(tokenId);
  await user.update(usedToken.user_id, { email: usedToken.email }, { skipEmailConfirmation: true });

  return usedToken;
}

export default Object.freeze({
  create,
  createAndSendEmail,
  findOneTokenByUserId,
  getEmailConfirmationPageEndpoint,
  confirmEmailUpdate,
});
