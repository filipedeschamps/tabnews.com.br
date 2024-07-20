import crypto from 'crypto';
import * as OTPAuth from 'otpauth';

const defaultTOTPConfigurations = {
  issuer: 'TabNews',
  algorithm: 'SHA1',
  digits: 6,
};

function createSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function createTOTP(secret, username) {
  if (!secret) {
    secret = createSecret();
  }
  return new OTPAuth.TOTP({ ...defaultTOTPConfigurations, secret, label: username });
}

const cryptoConfigurations = {
  algorithm: process.env.TOTP_ENCRYPTION_METHOD,
  key: crypto.createHash('sha512').update(process.env.TOTP_SECRET_KEY).digest('hex').substring(0, 32),
  encryptionIV: crypto.createHash('sha512').update(process.env.TOTP_SECRET_IV).digest('hex').substring(0, 16),
};

function encryptData(data) {
  const cipher = crypto.createCipheriv(
    cryptoConfigurations.algorithm,
    cryptoConfigurations.key,
    cryptoConfigurations.encryptionIV,
  );
  return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex')).toString('base64');
}

function decryptData(encryptedData) {
  const buff = Buffer.from(encryptedData, 'base64');
  const decipher = crypto.createDecipheriv(
    cryptoConfigurations.algorithm,
    cryptoConfigurations.key,
    cryptoConfigurations.encryptionIV,
  );
  return decipher.update(buff.toString('utf8'), 'hex', 'utf8') + decipher.final('utf8');
}

function validateOTP(userSecret, token) {
  const userTOTP = createTOTP(userSecret);
  return userTOTP.validate({ token }) !== null;
}

export default Object.freeze({ createTOTP, createSecret, decryptData, encryptData, validateOTP });
