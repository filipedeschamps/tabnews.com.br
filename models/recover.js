import email from 'infra/email.js';
import database from 'infra/database.js';
import webserver from 'infra/webserver.js';
import user from 'models/user.js';
import authentication from 'models/authentication';
import { NotFoundError } from 'errors/index.js';

async function createAndSendRecoveryEmail(user) {
  const tokenObject = await create(user);
  await sendEmailToUser(user, tokenObject.id);
}

async function findUserByUsernameOrEmail({ username, email }) {
  let userExist = {};
  if (username) {
    userExist = await user.findOneByUsername(username);
  } else if (email) {
    userExist = await user.findOneByEmail(email);
  }
  return userExist;
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
  const recoveryPageEndpoint = getRecoveryPageEndpoint(tokenId);

  await email.send({
    from: {
      name: 'TabNews',
      address: 'contato@tabnews.com.br',
    },
    to: user.email,
    subject: 'Recuperação de senha no TabNews',
    text: `${user.username}, uma solicitação de recuperação de senha foi solicitada, se não foi você quem solicitou ignore este e-mail.

Caso você tenha feito essa solicitação clique no link abaixo para alterar sua senha.

${recoveryPageEndpoint}

Atenciosamente,
Equipe TabNews
Rua Antônio da Veiga, 495, Blumenau, SC, 89012-500`,
  });
}

function getRecoveryPageEndpoint(tokenId) {
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
    text: `SELECT * FROM activate_account_tokens
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
  createAndSendRecoveryEmail,
  findUserByUsernameOrEmail,
  updatePassword,
  recoveryUserUsingTokenId,
});
