import { ForbiddenError, NotFoundError } from 'errors';
import database from 'infra/database.js';
import email from 'infra/email.js';
import webserver from 'infra/webserver.js';
import authorization from 'models/authorization.js';
import { ActivationEmail } from 'models/transactional';
import user from 'models/user.js';

async function createAndSendActivationEmail(user) {
  const tokenObject = await create(user);
  await sendEmailToUser(user, tokenObject.id);
}

async function create(user) {
  const query = {
    text: `INSERT INTO activate_account_tokens (user_id, expires_at)
           VALUES($1, now() + interval '15 minutes') RETURNING *;`,
    values: [user.id],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function sendEmailToUser(user, tokenId) {
  const activationPageEndpoint = getActivationPageEndpoint(tokenId);

  const { html, text } = ActivationEmail({
    username: user.username,
    activationLink: activationPageEndpoint,
  });

  await email.send({
    from: 'TabNews <contato@tabnews.com.br>',
    to: user.email,
    subject: 'Ative seu cadastro no TabNews',
    html,
    text,
  });
}

function getActivationApiEndpoint() {
  return `${webserver.host}/api/v1/activation`;
}

function getActivationPageEndpoint(tokenId) {
  return tokenId ? `${webserver.host}/cadastro/ativar/${tokenId}` : `${webserver.host}/cadastro/ativar`;
}

async function findOneTokenByUserId(userId) {
  const query = {
    text: 'SELECT * FROM activate_account_tokens WHERE user_id = $1 LIMIT 1;',
    values: [userId],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O token relacionado ao userId "${userId}" não foi encontrado no sistema.`,
      action: 'Verifique se o "id" do usuário está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return results.rows[0];
}

async function activateUserUsingTokenId(tokenId) {
  let tokenObject = await findOneTokenById(tokenId);
  if (!tokenObject.used) {
    const transaction = await database.transaction();

    try {
      await transaction.query('BEGIN');

      tokenObject = await findOneValidTokenById(tokenId, { transaction });

      await activateUserByUserId(tokenObject.user_id, { transaction });
      tokenObject = await markTokenAsUsed(tokenObject.id, { transaction });

      await transaction.query('COMMIT');
      await transaction.release();
    } catch (error) {
      await transaction.query('ROLLBACK');
      await transaction.release();
      throw error;
    }
  }
  return tokenObject;
}

async function activateUserByUserId(userId, options = {}) {
  const userToActivate = await user.findOneById(userId, options);

  if (!authorization.can(userToActivate, 'read:activation_token')) {
    throw new ForbiddenError({
      message: `Você não pode mais ler tokens de ativação.`,
      action: 'Verifique se você já está logado ou tentando ativar novamente o seu ou outro usuário que já está ativo.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:ACTIVATION:ACTIVATE_USER_BY_USER_ID:FEATURE_NOT_FOUND',
    });
  }

  await user.removeFeatures(userToActivate.id, ['read:activation_token'], options);
  return await user.addFeatures(
    userToActivate.id,
    [
      'create:session',
      'read:session',
      'create:content',
      'create:content:text_root',
      'create:content:text_child',
      'update:content',
      'update:user',
    ],
    options,
  );
}

async function findOneTokenById(tokenId) {
  const query = {
    text: `SELECT * FROM activate_account_tokens
        WHERE id = $1
        LIMIT 1;`,
    values: [tokenId],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O token de ativação utilizado não foi encontrado no sistema.`,
      action: 'Certifique-se que está sendo enviado o token corretamente.',
      stack: new Error().stack,
    });
  }

  return results.rows[0];
}

async function findOneValidTokenById(tokenId, options = {}) {
  const query = {
    text: `SELECT * FROM activate_account_tokens
        WHERE id = $1
        AND used = false
        AND expires_at >= now()
        LIMIT 1;`,
    values: [tokenId],
  };

  const results = await database.query(query, options);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O token de ativação utilizado não foi encontrado no sistema ou expirou.`,
      action: 'Faça login novamente para receber um novo token por email.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:ACTIVATION:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
      key: 'token_id',
    });
  }

  return results.rows[0];
}

async function markTokenAsUsed(tokenId, options = {}) {
  const query = {
    text: `UPDATE activate_account_tokens
            SET used = true,
            updated_at = (now() at time zone 'utc')
            WHERE id = $1
            RETURNING *;`,
    values: [tokenId],
  };

  const results = await database.query(query, options);

  return results.rows[0];
}

async function update(tokenId, tokenBody) {
  const currentToken = await findOneTokenById(tokenId);
  const updatedToken = { ...currentToken, ...tokenBody };

  const query = {
    text: `UPDATE activate_account_tokens SET
            user_id = $2,
            used = $3,
            expires_at = $4,
            created_at = $5,
            updated_at = $6
            WHERE id = $1
            RETURNING *;`,
    values: [
      tokenId,
      updatedToken.user_id,
      updatedToken.used,
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
  createAndSendActivationEmail,
  findOneTokenByUserId,
  getActivationApiEndpoint,
  getActivationPageEndpoint,
  activateUserUsingTokenId,
  activateUserByUserId,
  update,
});
