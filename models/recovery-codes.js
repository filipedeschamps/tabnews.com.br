import { NotFoundError } from 'errors';
import database from 'infra/database.js';
import password from 'models/password.js';

const RECOVERY_CODE_LENTGH = 10;
const RECOVERY_CODES_AMOUNT = 10;

function makeCode(length = 10) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
}

function generateRecoveryCodes() {
  const recoveryCodes = [];

  for (let i = 0; i < RECOVERY_CODES_AMOUNT; i++) {
    const newCode = makeCode(RECOVERY_CODE_LENTGH);
    recoveryCodes.push(newCode);
  }

  return recoveryCodes;
}

async function create(authenticatedUser) {
  await invalidateAllRecoveryCodesByUserId(authenticatedUser.id);

  const createdRecoveryCodes = generateRecoveryCodes();

  for (const code of createdRecoveryCodes) {
    const codeHash = await password.hash(code);
    await database.query({
      text: `
        INSERT INTO
          recovery_codes (user_id, code)
        VALUES
          ($1, $2)
        ;`,
      values: [authenticatedUser.id, codeHash],
    });
  }

  return createdRecoveryCodes;
}

async function invalidateAllRecoveryCodesByUserId(userId) {
  await database.query({
    text: `
        UPDATE recovery_codes
        SET valid = false, updated_at = now()
        WHERE
          user_id = $1
          AND valid = true
        ;`,
    values: [userId],
  });
}

async function findRecoveryCodeByUserId(userId, providedRecoveryCode) {
  const query = {
    text: `
        SELECT
          id, code
        FROM recovery_codes
        WHERE
          user_id = $1
          AND valid = true
        ;`,
    values: [userId],
  };

  const result = await database.query(query);

  const validRecoveryCodes = result.rows;

  for (let i = 0; i < validRecoveryCodes.length; i++) {
    const recoveryCode = validRecoveryCodes[i];
    const recoveryCodeMatches = await password.compare(providedRecoveryCode, recoveryCode.code);
    if (recoveryCodeMatches) {
      return recoveryCode.id;
    }
  }

  throw new NotFoundError({
    message: `O código de recuperação não foi encontrado no sistema ou já foi usado anteriormente.`,
    action: 'Utilize um outro código de recuperação',
    errorLocationCode: 'MODEL:USER_RECOVERY_CODES:FIND_RECOVERY_TOKEN_BY_USER_ID:NOT_FOUND',
  });
}

async function invalidateRecoveryCodeById(recoveryCodeId) {
  await database.query({
    text: `
        UPDATE recovery_codes
        SET valid = false, updated_at = now()
        WHERE
          id = $1
          AND valid = true
        ;`,
    values: [recoveryCodeId],
  });
}

async function countValidRecoveryCodesByUserId(userId) {
  const result = await database.query({
    text: `
        SELECT
          COUNT(*)
        FROM
          recovery_codes
        WHERE
          user_id = $1
          AND valid = true
        ;`,
    values: [userId],
  });

  return result.rows[0].count;
}

export default Object.freeze({
  RECOVERY_CODES_AMOUNT,
  RECOVERY_CODE_LENTGH,
  makeCode,
  generateRecoveryCodes,
  create,
  findRecoveryCodeByUserId,
  invalidateAllRecoveryCodesByUserId,
  invalidateRecoveryCodeById,
  countValidRecoveryCodesByUserId,
});
