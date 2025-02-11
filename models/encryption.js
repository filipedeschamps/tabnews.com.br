import crypto from 'crypto';

const cryptoConfigurations = {
  algorithm: process.env.TOTP_ENCRYPTION_METHOD,
  key: crypto.createHash('sha512').update(process.env.TOTP_SECRET_KEY).digest('hex').substring(0, 32),
};

function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(cryptoConfigurations.algorithm, cryptoConfigurations.key, iv);
  const encryptedData = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encryptedData]).toString('hex');
}

function decryptData(encrypted) {
  const data = Buffer.from(encrypted, 'hex');
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encryptedData = data.subarray(32);
  const decipher = crypto.createDecipheriv(cryptoConfigurations.algorithm, cryptoConfigurations.key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(encryptedData, 'binary', 'utf-8') + decipher.final('utf-8');
}

export default Object.freeze({
  encryptData,
  decryptData,
});
