import { InternalServerError } from 'errors';
import encryption from 'models/encryption';
import otp from 'models/otp';

describe('Encryption', () => {
  describe('encryptData', () => {
    it('should encrypt a secret into a data of right size', () => {
      const secret = otp.createSecret();
      const encryptedSecret = encryption.encryptData(secret);

      expect(encryptedSecret).toHaveLength(120);
    });

    it('should produce a different encrypted string for the same secret', () => {
      const secret = otp.createSecret();
      const encryptedSecret1 = encryption.encryptData(secret);
      const encryptedSecret2 = encryption.encryptData(secret);

      expect(encryptedSecret1).not.toBe(encryptedSecret2);
    });
  });

  describe('decryptData', () => {
    it('should decrypt a secret to the same before encryption', () => {
      const secret = otp.createSecret();
      const encryptedSecret = encryption.encryptData(secret);
      const decryptedSecret = encryption.decryptData(encryptedSecret);

      expect(encryptedSecret).not.toBe(secret);
      expect(decryptedSecret).toBe(secret);
    });

    it('should correctly encrypt and decrypt an empty string', () => {
      const secret = '';
      const encryptedSecret = encryption.encryptData(secret);
      const decryptedSecret = encryption.decryptData(encryptedSecret);

      expect(encryptedSecret).not.toBe(secret);
      expect(decryptedSecret).toBe(secret);
    });

    it('should throw an error when trying to decrypt tampered data', () => {
      const secret = otp.createSecret();
      const encryptedSecret = encryption.encryptData(secret);

      const lastChar = encryptedSecret.slice(-1);
      const tamperedChar = lastChar === 'a' ? 'b' : 'a';
      const tamperedSecret = encryptedSecret.slice(0, -1) + tamperedChar;

      expect.assertions(4);

      try {
        encryption.decryptData(tamperedSecret);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerError);
        expect(error.name).toBe('InternalServerError');
        expect(error.message).toBe('Não foi possível descriptografar o dado. A verificação de integridade falhou.');
        expect(error.errorLocationCode).toBe('MODEL:ENCRYPTION:DECRYPT_DATA:INTEGRITY_CHECK_FAILED');
      }
    });
  });
});
