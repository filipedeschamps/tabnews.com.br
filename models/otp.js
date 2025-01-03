import crypto from 'crypto';
import * as OTPAuth from 'otpauth';

import user from 'models/user';

const defaultTOTPConfigurations = {
  issuer: 'TabNews',
  algorithm: 'SHA1',
  digits: 6,
};

const cryptoConfigurations = {
  algorithm: process.env.TOTP_ENCRYPTION_METHOD,
  key: crypto.createHash('sha512').update(process.env.TOTP_SECRET_KEY).digest('hex').substring(0, 32),
};

function createSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function createTotp(secret, username) {
  if (!secret) {
    secret = createSecret();
  }
  return new OTPAuth.TOTP({ ...defaultTOTPConfigurations, secret, label: username });
}

function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(cryptoConfigurations.algorithm, cryptoConfigurations.key, iv);
  const encryptedData = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);

  return Buffer.concat([iv, encryptedData]).toString('hex');
}

function decryptData(encrypted) {
  const data = Buffer.from(encrypted, 'hex');
  const iv = data.subarray(0, 16);
  const encryptedData = data.subarray(16);
  const decipher = crypto.createDecipheriv(cryptoConfigurations.algorithm, cryptoConfigurations.key, iv);

  return decipher.update(encryptedData, 'binary', 'utf-8') + decipher.final('utf-8');
}

function validateUserTotp(userEncryptedSecret, token) {
  const userSecret = decryptData(userEncryptedSecret);
  const userTOTP = createTotp(userSecret);

  return userTOTP.validate({ token }) !== null;
}

function validateTotp(secret, token) {
  const totp = createTotp(secret);

  return totp.validate({ token }) !== null;
}

function makeCode(length = 10) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
}

function createRecoveryCodes() {
  const RECOVERY_CODES_LENTGH = 10;
  const RECOVERY_CODES_AMOUNT = 10;

  const recoveryCodesObject = {};

  for (let i = 0; i < RECOVERY_CODES_AMOUNT; i++) {
    const newCode = makeCode(RECOVERY_CODES_LENTGH);
    recoveryCodesObject[newCode] = true;
  }

  return recoveryCodesObject;
}

async function validateAndMarkRecoveryCode(targetUser, recoveryCode) {
  const recoveryCodes = JSON.parse(decryptData(targetUser.totp_recovery_codes));

  if (recoveryCodes[recoveryCode]) {
    recoveryCodes[recoveryCode] = false;

    await user.update(targetUser, { totp_recovery_codes: recoveryCodes });

    return true;
  }

  return false;
}

export default Object.freeze({
  createTotp,
  createSecret,
  decryptData,
  encryptData,
  validateUserTotp,
  validateTotp,
  makeCode,
  createRecoveryCodes,
  validateAndMarkRecoveryCode,
});
