import otp from 'models/otp.js';

describe('OTP model', () => {
  it('should create a TOTP secret of size 32', () => {
    const secret = otp.createSecret();

    expect(secret).toHaveLength(32);
  });

  it('should create a TOTP issued by TabNews and with username on label', () => {
    const username = 'userTOTP';
    const secret = otp.createSecret();
    const totp = otp.createTotp(secret, 'userTOTP');

    expect(totp.label).toStrictEqual(username);
    expect(totp.issuer).toBe('TabNews');
  });

  it('should detect a valid token', () => {
    const secret = otp.createSecret();
    const totp = otp.createTotp(secret);
    const token = totp.generate();

    expect(otp.validateTotp(secret, token)).toBeTruthy();
  });

  it('should detect an invalid token', () => {
    const secret = otp.createSecret();
    const token = otp.createTotp().generate();

    expect(otp.validateTotp(secret, token)).toBeFalsy();
  });

  it('should encrypt a secret into a data of size 128', () => {
    const secret = otp.createSecret();
    const encryptedSecret = otp.encryptData(secret);

    expect(encryptedSecret).toHaveLength(128);
  });

  it('should decrypt a secret to the same before encryption', () => {
    const secret = otp.createSecret();
    const encryptedSecret = otp.encryptData(secret);
    const decryptedSecret = otp.decryptData(encryptedSecret);

    expect(decryptedSecret).toStrictEqual(secret);
  });

  it('should create recovery codes', () => {
    const recoveryCodes = otp.createRecoveryCodes();

    for (const key in recoveryCodes) {
      expect(key).toHaveLength(10);
      expect(recoveryCodes[key]).toBeTruthy();
    }

    expect(Object.keys(recoveryCodes)).toHaveLength(10);
  });

  it('should encrypt recovery codes into a data of size 416', () => {
    const recoveryCodes = otp.createRecoveryCodes();
    const encryptedCodes = otp.encryptData(JSON.stringify(recoveryCodes));

    expect(encryptedCodes).toHaveLength(416);
  });

  it('should decrypt recovery codes to the same before encryption', () => {
    const recoveryCodes = otp.createRecoveryCodes();
    const encryptedCodes = otp.encryptData(JSON.stringify(recoveryCodes));
    const decryptedCodes = JSON.parse(otp.decryptData(encryptedCodes));

    expect(decryptedCodes).toStrictEqual(recoveryCodes);
  });
});
