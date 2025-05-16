import crypto from 'crypto';

const config = {
  algorithm: 'aes-256-gcm',
  key: crypto.createHash('sha256').update(process.env.TOTP_SECRET_KEY).digest(),
  length: 32,
  ivSize: 16,
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

  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString(config.decoding);
}

export default Object.freeze({
  encryptData,
  decryptData,
});
