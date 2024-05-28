import crypto from 'crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

import { ValidationError } from 'errors';

const defaultTOTPConfigurations = {
  issuer: 'TabNews.com.br',
  algorithm: 'SHA1',
  digits: 6,
};

function createSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function createTOTP(secret, username) {
  if (!secret) {
    throw new ValidationError({
      message: `É necessário informar o "secret" do usuário.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:TOTP:CREATE_TOTP_CONFIG:SECRET_REQUIRED',
      key: 'userId',
    });
  }

  return new OTPAuth.TOTP({ ...defaultTOTPConfigurations, secret, label: username });
}

async function createQrCode(username) {
  if (!username) {
    throw new ValidationError({
      message: `É necessário informar o "username" do usuário.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:TOTP:CREATE_QRCODE:USERNAME_REQUIRED',
      key: 'userId',
    });
  }

  const secret = createSecret();

  const totp = createTOTP(secret, username);
  const qrUrl = await QRCode.toDataURL(totp.toString());
  return {
    qrcode_uri: qrUrl,
    secret: secret,
  };
}

const cryptoConfigurations = {
  algorithm: process.env.TOTP_ENCRYPTION_METHOD || 'aes-256-cbc',
  key: crypto
    .createHash('sha512')
    .update(process.env.TOTP_SECRET_KEY || 'tabnews')
    .digest('hex')
    .substring(0, 32),
  encryptionIV: crypto
    .createHash('sha512')
    .update(process.env.TOTP_SECRET_IV || 'tabnews')
    .digest('hex')
    .substring(0, 16),
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

export default Object.freeze({ createTOTP, createSecret, createQrCode, decryptData, encryptData, validateOTP });
