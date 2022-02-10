import { v4 as uuid } from 'uuid';
import email from 'infra/email.js';
import database from 'infra/database.js';
import user from 'models/user.js';
import authorization from 'models/authorization.js';
import { NotFoundError, ForbiddenError } from 'errors/index.js';

async function sendActivationEmailToUser(user) {
  const tokenObject = await createTokenInDatabase(user);
  await sendEmailToUser(user, tokenObject.id);

  async function createTokenInDatabase(user) {
    const query = {
      text: `INSERT INTO activate_account_tokens (user_id, expires_at)
             VALUES($1, now() + interval '15 minutes') RETURNING *;`,
      values: [user.id],
    };

    const results = await database.query(query);
    return results.rows[0];
  }

  async function sendEmailToUser(user, tokenId) {
    const activationUrl = getActivationUrl(tokenId);

    await email.send({
      from: {
        name: 'TabNews',
        address: 'contato@tabnews.com.br',
      },
      to: user.email,
      subject: 'Ative seu cadastro no TabNews',
      text: `${user.username}, clique no link abaixo para ativar seu cadastro no TabNews:

${activationUrl}

Caso você não tenha feito essa requisição, ignore esse email.
        
Atenciosamente,
Equipe TabNews`,
    });
  }
}

function getActivationUrl(tokenId) {
  // TODO: maybe get this from environment variables
  let webserverHost = 'https://www.tabnews.com.br';

  if (['test', 'development'].includes(process.env.NODE_ENV) || process.env.CI) {
    webserverHost = `http://${process.env.WEBSERVER_HOST}:${process.env.WEBSERVER_PORT}`;
  }

  if (['preview'].includes(process.env.VERCEL_ENV)) {
    webserverHost = `https://${process.env.VERCEL_URL}`;
  }

  const activationUrl = `${webserverHost}/api/v1/activate/${tokenId}`;
  return activationUrl;
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
  const tokenObject = await findOneValidTokenById(tokenId);
  const userToActivate = await user.findOneById(tokenObject.user_id);

  if (!authorization.can(userToActivate, 'read:activation_token')) {
    throw new ForbiddenError({
      message: `O usuário "${userToActivate.username}" não pode ler o token de ativação.`,
      action:
        'Verifique se você está tentando ativar o usuário correto, se ele possui a feature "read:activation_token", ou se ele já está ativo.',
      stack: new Error().stack,
    });
  }

  // TODO: in the future, understand how to run
  // this inside a transaction, or at least
  // reduce how many queries are run.
  await markTokenAsUsed(tokenObject.id);
  await user.removeFeatures(userToActivate.id, ['read:activation_token']);
  return await user.addFeatures(userToActivate.id, ['create:session', 'read:session', 'create:post', 'create:comment']);
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
      message: `O token "${tokenId}" não foi encontrado no sistema ou expirou.`,
      action: 'Faça um novo cadastro.',
      stack: new Error().stack,
    });
  }

  return results.rows[0];
}

async function markTokenAsUsed(tokenId) {
  const query = {
    text: `UPDATE activate_account_tokens
            SET used = true
            WHERE id = $1;`,
    values: [tokenId],
  };

  await database.query(query);
}

export default Object.freeze({
  sendActivationEmailToUser,
  findOneTokenByUserId,
  getActivationUrl,
  activateUserUsingTokenId,
});
