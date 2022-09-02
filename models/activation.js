import email from 'infra/email.js';
import database from 'infra/database.js';
import webserver from 'infra/webserver.js';
import user from 'models/user.js';
import authorization from 'models/authorization.js';
import { NotFoundError, ForbiddenError } from 'errors/index.js';

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

  await email.send({
    from: {
      name: 'TabNews',
      address: 'contato@tabnews.com.br',
    },
    to: user.email,
    subject: 'Ative seu cadastro no TabNews',
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no TabNews:

${activationPageEndpoint}

Caso você não tenha feito esta requisição, ignore esse email.

Atenciosamente,
Equipe TabNews
Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500`,
  });
}

function getActivationApiEndpoint() {
  const webserverHost = webserver.getHost();
  return `${webserverHost}/api/v1/activation`;
}

function getActivationPageEndpoint(tokenId) {
  const webserverHost = webserver.getHost();
  return tokenId ? `${webserverHost}/cadastro/ativar/${tokenId}` : `${webserverHost}/cadastro/ativar`;
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
    tokenObject = await findOneValidTokenById(tokenId);
    await activateUserByUserId(tokenObject.user_id);
    return await markTokenAsUsed(tokenObject.id);
  }
  return tokenObject;
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, 'read:activation_token')) {
    throw new ForbiddenError({
      message: `Você não pode mais ler tokens de ativação.`,
      action: 'Verifique se você já está logado ou tentando ativar novamente o seu ou outro usuário que já está ativo.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:ACTIVATION:ACTIVATE_USER_BY_USER_ID:FEATURE_NOT_FOUND',
    });
  }

  // TODO: in the future, understand how to run
  // this inside a transaction, or at least
  // reduce how many queries are run.
  await user.removeFeatures(userToActivate.id, ['read:activation_token']);
  return await user.addFeatures(userToActivate.id, [
    'create:session',
    'read:session',
    'create:content',
    'create:content:text_root',
    'create:content:text_child',
    'update:content',
    'update:user',
  ]);
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

async function findOneValidTokenById(tokenId) {
  const query = {
    text: `SELECT * FROM activate_account_tokens
        WHERE id = $1
        AND used = false
        AND expires_at >= now()
        LIMIT 1;`,
    values: [tokenId],
  };

  const results = await database.query(query);

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

async function markTokenAsUsed(tokenId) {
  const query = {
    text: `UPDATE activate_account_tokens
            SET used = true,
            updated_at = (now() at time zone 'utc')
            WHERE id = $1
            RETURNING *;`,
    values: [tokenId],
  };

  const results = await database.query(query);

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
