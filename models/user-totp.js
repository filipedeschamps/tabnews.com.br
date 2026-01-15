import { ConflictError, NotFoundError, ValidationError } from 'errors';
import database from 'infra/database';

import encryption from './encryption';
import otp from './otp';

async function startSetup(userObject) {
  validateTotpDisabled(userObject);

  const totp = otp.createTotp(null, userObject.username);

  const encryptedTotp = encryption.encryptData(totp.secret.base32);

  const query = {
    text: `
      INSERT INTO temp_totp_secrets (user_id, totp_secret, expires_at)
      VALUES ($1, $2, now() + interval '10 minutes')
      ON CONFLICT (user_id) DO UPDATE SET
        totp_secret = EXCLUDED.totp_secret,
        expires_at = EXCLUDED.expires_at;`,
    values: [userObject.id, encryptedTotp],
  };

  await database.query(query);
  return totp;
}

async function enable(userObject, token) {
  validateTotpDisabled(userObject);

  const validTotp = await findOneValidByUserId(userObject.id);
  validateToken(validTotp.totp_secret, token);

  await database.query({
    text: `
      WITH deleted_totp AS (
        DELETE FROM temp_totp_secrets
        WHERE user_id = $1
      )
      UPDATE users
      SET totp_secret = $2, updated_at = now()
      WHERE id = $1;`,
    values: [userObject.id, validTotp.totp_secret],
  });
}

async function findOneValidByUserId(userId) {
  const query = {
    text: `
      SELECT
        totp_secret
      FROM
        temp_totp_secrets
      WHERE
        user_id = $1
        AND expires_at >= now()
      LIMIT 1;`,
    values: [userId],
  };

  const result = await database.query(query);
  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: `O segredo TOTP não foi encontrado no sistema ou expirou.`,
      action: 'Gere um novo segredo TOTP.',
      errorLocationCode: 'MODEL:USER_TOTP:FIND_ONE_VALID_BY_USER_ID:NOT_FOUND',
    });
  }

  return result.rows[0];
}

async function disable(userObject, token) {
  if (!userObject.totp_secret) return;

  validateToken(userObject.totp_secret, token);

  const query = {
    text: `
      UPDATE users
      SET totp_secret = NULL, updated_at = now()
      WHERE id = $1;`,
    values: [userObject.id],
  };

  await database.query(query);
}

function validateTotpDisabled(userObject) {
  if (userObject.totp_secret) {
    throw new ConflictError({
      message: 'O TOTP já está habilitado.',
      action: 'Se deseja alterar o segredo, desabilite o TOTP primeiro.',
      errorLocationCode: 'MODEL:USER_TOTP:VALIDATE_TOTP_DISABLED:TOTP_ENABLED',
    });
  }
}

function validateToken(encryptedSecret, token) {
  const secret = encryption.decryptData(encryptedSecret);

  if (!otp.validateTotp(secret, token)) {
    throw new ValidationError({
      message: `O código TOTP informado é inválido.`,
      action: `Verifique o código e tente novamente.`,
      errorLocationCode: `MODEL:USER_TOTP:VALIDATE_TOKEN:INVALID_TOKEN`,
    });
  }
}

export default Object.freeze({
  startSetup,
  enable,
  disable,
  validateToken,
});
