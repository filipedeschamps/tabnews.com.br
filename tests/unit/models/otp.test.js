import otp from 'models/otp';

describe('OTP', () => {
  describe('createSecret', () => {
    it('should create a TOTP secret of size 32', () => {
      const secret = otp.createSecret();

      expect(secret).toHaveLength(32);
    });

    it('should create a different secret on each call', () => {
      const secret1 = otp.createSecret();
      const secret2 = otp.createSecret();

      expect(secret1).not.toBe(secret2);
    });
  });

  describe('createTotp', () => {
    it('should create a TOTP issued by TabNews and with username on label', () => {
      const secret = otp.createSecret();
      const totp = otp.createTotp(secret, 'testUsername');

      expect(totp.label).toBe('testUsername');
      expect(totp.issuer).toBe('TabNews');
      expect(totp.algorithm).toBe('SHA1');
      expect(totp.digits).toBe(6);
      expect(totp.secret.base32).toHaveLength(32);
    });

    it('should create a TOTP instance with a new secret if none is provided', () => {
      const totp = otp.createTotp(undefined, 'testUser');

      expect(totp.secret.base32).toHaveLength(32);
    });

    it('should generate different tokens for different secrets at the same time', () => {
      const username = 'testUser';
      const secret1 = otp.createSecret();
      const secret2 = otp.createSecret();
      expect(secret1).not.toBe(secret2);

      const totp1 = otp.createTotp(secret1, username);
      const totp2 = otp.createTotp(secret2, username);

      expect(totp1.toString()).not.toBe(totp2.toString());
    });

    it('should be deterministic and create functionally identical TOTP objects for the same secret', () => {
      const username = 'testUser';
      const secret = otp.createSecret();

      const totp1 = otp.createTotp(secret, username);
      const totp2 = otp.createTotp(secret, username);

      expect(totp1.toString()).toBe(totp2.toString());
    });
  });

  describe('validateTotp', () => {
    it('should detect a valid token', () => {
      const secret = otp.createSecret();
      const token = otp.createTotp(secret).generate();

      expect(otp.validateTotp(secret, token)).toBe(true);
    });

    it('should detect an invalid token', () => {
      const secret = otp.createSecret();
      const token = otp.createTotp().generate();

      expect(otp.validateTotp(secret, token)).toBe(false);
    });

    it('should accept a token from the previous time window', () => {
      vi.useFakeTimers();

      const secret = otp.createSecret();
      const token = otp.createTotp(secret).generate();

      vi.advanceTimersByTime(31 * 1000);

      expect(otp.validateTotp(secret, token)).toBe(true);

      vi.useRealTimers();
    });

    it('should accept a token from the next time window', () => {
      vi.useFakeTimers();

      const secret = otp.createSecret();
      const totp = otp.createTotp(secret);

      const currentTime = Date.now();
      const futureTime = currentTime + 30 * 1000;

      const futureToken = totp.generate({ timestamp: futureTime });

      expect(otp.validateTotp(secret, futureToken)).toBe(true);

      vi.useRealTimers();
    });

    it('should reject an expired token outside the time window', () => {
      vi.useFakeTimers();

      const secret = otp.createSecret();
      const token = otp.createTotp(secret).generate();

      vi.advanceTimersByTime(61 * 1000);

      expect(otp.validateTotp(secret, token)).toBe(false);

      vi.useRealTimers();
    });

    it.each([
      ['12345'], // Too short
      ['1234567'], // Too long
      ['abcdef'], // Non-numeric
      [''],
      [null],
      [undefined],
    ])('should reject invalid token format: %s', (invalidToken) => {
      const secret = otp.createSecret();
      expect(otp.validateTotp(secret, invalidToken)).toBe(false);
    });
  });
});
