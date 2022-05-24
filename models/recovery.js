import email from 'infra/email.js';
import database from 'infra/database.js';
import webserver from 'infra/webserver.js';
import user from 'models/user.js';
import authentication from 'models/authentication.js';
import { NotFoundError } from 'errors/index.js';

async function createAndSendRecoveryEmail(secureInputValues) {
  const userFound = await findUserByUsernameOrEmail(secureInputValues);
  const tokenObject = await create(userFound);
  await sendEmailToUser(userFound, tokenObject.id);

  return tokenObject;
}

async function findUserByUsernameOrEmail({ username, email }) {
  if (username) {
    return await user.findOneByUsername(username);
  }

  if (email) {
    return await user.findOneByEmail(email);
  }
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
    text: `${user.username}, uma solicitação de recuperação de senha foi solicitada. Caso você não tenha feito esta requisição, ignore esse email.

Caso você tenha feito essa solicitação clique no link abaixo para definir uma nova senha.

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

async function recoveryUserUsingTokenId(tokenId) {
  let tokenObject = await findOneTokenById(tokenId);

  if (!tokenObject.used) {
    tokenObject = await findOneValidTokenById(tokenId);
    await markTokenAsUsed(tokenObject.id);
    return tokenObject;
  }
  throw new NotFoundError({
    message: `O token de recuperação de senha já foi utilizado.`,
    action: 'Solicite uma nova recuperação de senha.',
    stack: new Error().stack,
    errorUniqueCode: 'MODEL:RECOVER:recoveryUserUsingTokenId:NOT_FOUND',
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
      errorUniqueCode: 'MODEL:RECOVER:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
      key: 'token_id',
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

async function updatePassword(userId, password) {
  const currentUser = await user.findOneById(userId);
  const hashedPassword = await authentication.hashPassword(password);

  const userWithUpdatedValues = { ...currentUser, password: hashedPassword };

  const updatedUser = await runUpdateQuery(userWithUpdatedValues);
  return updatedUser;

  async function runUpdateQuery({ id, password }) {
    const query = {
      text: `UPDATE users SET
                  password = $1,
                  updated_at = (now() at time zone 'utc')
                  WHERE
                    id = $2
                  RETURNING *;`,
      values: [password, id],
    };

    const results = await database.query(query);
    return results.rows[0];
  }
}

export default Object.freeze({
  create,
  createAndSendRecoveryEmail,
  updatePassword,
  recoveryUserUsingTokenId,
  findOneTokenByUserId,
  getRecoverPageEndpoint,
});
