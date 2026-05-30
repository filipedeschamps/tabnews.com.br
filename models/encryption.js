import crypto from 'crypto';

import { InternalServerError } from 'errors';

const config = {
  algorithm: 'aes-256-gcm',
  key: crypto.createHash('sha256').update(process.env.TOTP_SECRET_KEY).digest(),
  length: 32,
  ivSize: 12, // Why 12? https://crypto.stackexchange.com/questions/41601/aes-gcm-recommended-iv-size-why-12-bytes
  authTagSize: 16,
  encoding: 'hex',
  decoding: 'utf8',
};

function encryptData(data) {
  const iv = crypto.randomBytes(config.ivSize);
  const cipher = crypto.createCipheriv(config.algorithm, config.key, iv);
  const encryptedData = Buffer.concat([cipher.update(data, config.decoding), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encryptedData]).toString(config.encoding);
}

function decryptData(encrypted) {
  const data = Buffer.from(encrypted, config.encoding);
  const iv = data.subarray(0, config.ivSize);
  const authTag = data.subarray(config.ivSize, config.ivSize + config.authTagSize);
  const encryptedData = data.subarray(config.ivSize + config.authTagSize);
  const decipher = crypto.createDecipheriv(config.algorithm, config.key, iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString(config.decoding);
  } catch (error) {
    if (error.message?.startsWith('Unsupported state')) {
      throw new InternalServerError({
        message: 'Não foi possível descriptografar o dado. A verificação de integridade falhou.',
        errorLocationCode: 'MODEL:ENCRYPTION:DECRYPT_DATA:INTEGRITY_CHECK_FAILED',
        cause: error,
      });
    }

    throw error;
  }
}

export default Object.freeze({
  encryptData,
  decryptData,
});
