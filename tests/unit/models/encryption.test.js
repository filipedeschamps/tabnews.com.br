import encryption from 'models/encryption';
import otp from 'models/otp';

describe('Encryption model', () => {
  it('should encrypt a secret into a data of right size', () => {
    const secret = otp.createSecret();
    const encryptedSecret = encryption.encryptData(secret);

    expect(encryptedSecret).toHaveLength(128);
  });

  it('should decrypt a secret to the same before encryption', () => {
    const secret = otp.createSecret();
    const encryptedSecret = encryption.encryptData(secret);
    const decryptedSecret = encryption.decryptData(encryptedSecret);

    expect(decryptedSecret).toStrictEqual(secret);
  });
});
