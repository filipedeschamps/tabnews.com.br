import email from 'infra/email.js';
import database from 'infra/database.js';
import webserver from 'infra/webserver.js';
import user from 'models/user.js';
import session from 'models/session';
import { NotFoundError, ValidationError } from 'errors/index.js';

async function createAndSendRecoveryEmail(secureInputValues) {
  const userFound = await findUserByUsernameOrEmail(secureInputValues);
  const tokenObject = await create(userFound);
  await sendEmailToUser(userFound, tokenObject.id);

  return tokenObject;
}

async function findUserByUsernameOrEmail({ username, email }) {
  try {
    if (username) {
      return await user.findOneByUsername(username);
    }

    if (email) {
      return await user.findOneByEmail(email);
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ValidationError({
        message: `O "${username ? 'username' : 'email'}" informado não foi encontrado no sistema.`,
        key: username ? 'username' : 'email',
        errorLocationCode: 'MODEL:RECOVERY:FIND_USER_BY_USERNAME_OR_EMAIL:NOT_FOUND',
      });
    }
  }

  throw error;
}

async function create(user) {
  const query = {
    text: `INSERT INTO reset_password_tokens (user_id, expires_at)
           VALUES($1, now() + interval '15 minutes') RETURNING *;`,
    values: [user.id],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function sendEmailToUser(user, tokenId) {
  const recoverPageEndpoint = getRecoverPageEndpoint(tokenId);

  await email.send({
    from: {
      name: 'TabNews',
      address: 'contato@tabnews.com.br',
    },
    to: user.email,
    subject: 'Recuperação de Senha',
    text: `${user.username}, foi solicitada uma recuperação de senha. Caso você não tenha feito a solicitação, ignore esse email.

Caso você tenha feito essa solicitação, clique no link abaixo para definir uma nova senha:

${recoverPageEndpoint}

Atenciosamente,
Equipe TabNews
Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500`,
  });
}

function getRecoverPageEndpoint(tokenId) {
  const webserverHost = webserver.getHost();
  return `${webserverHost}/cadastro/recuperar/${tokenId}`;
}

async function resetUserPassword(secureInputValues) {
  const tokenObject = await findOneValidTokenById(secureInputValues.token_id);

  if (!tokenObject.used) {
    const userToken = await markTokenAsUsed(tokenObject.id);
    await session.expireAllFromUserId(tokenObject.user_id);
    await updateUserPassword(tokenObject.user_id, secureInputValues.password);
    return userToken;
  }

  throw new NotFoundError({
    message: `O token de recuperação de senha não foi encontrado ou já foi utilizado.`,
    action: 'Solicite uma nova recuperação de senha.',
    stack: new Error().stack,
    errorLocationCode: 'MODEL:RECOVERY:RESET_USER_PASSWORD:NOT_FOUND',
    key: 'token_id',
  });
}

async function findOneTokenById(tokenId) {
  const query = {
    text: `SELECT * FROM reset_password_tokens
        WHERE id = $1
        LIMIT 1;`,
    values: [tokenId],
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

async function findOneValidTokenById(tokenId) {
  const query = {
    text: `SELECT * FROM reset_password_tokens
        WHERE id = $1
        AND used = false
        AND expires_at >= now()
        LIMIT 1;`,
    values: [tokenId],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.`,
      action: 'Solicite uma nova recuperação de senha.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:RECOVERY:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
      key: 'token_id',
    });
  }

  return results.rows[0];
}

async function findOneTokenByUserId(userId) {
  const query = {
    text: `SELECT * FROM reset_password_tokens
        WHERE user_id = $1
        LIMIT 1;`,
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
    text: `UPDATE reset_password_tokens
            SET used = true,
            updated_at = (now() at time zone 'utc')
            WHERE id = $1
            RETURNING *;`,
    values: [tokenId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function updateUserPassword(userId, password) {
  const currentUser = await user.findOneById(userId);
  await user.update(currentUser.username, { password });
}

async function update(tokenId, tokenBody) {
  const currentToken = await findOneTokenById(tokenId);
  const updatedToken = { ...currentToken, ...tokenBody };

  const query = {
    text: `UPDATE reset_password_tokens SET
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
  createAndSendRecoveryEmail,
  findOneTokenById,
  findOneTokenByUserId,
  getRecoverPageEndpoint,
  resetUserPassword,
  update,
});
