import * as OTPAuth from 'otpauth';

const defaultTOTPConfigurations = {
  issuer: 'TabNews',
  algorithm: 'SHA1',
  digits: 6,
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

function validateTotp(secret, token) {
  if (!token) return false;

  const totp = createTotp(secret);

  return totp.validate({ token }) !== null;
}

export default Object.freeze({
  createTotp,
  createSecret,
  validateTotp,
});
