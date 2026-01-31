import recoveryCodes from 'models/recovery-codes.js';

describe('Recovery codes', () => {
  it('should create a recovery code with the right size', () => {
    const code = recoveryCodes.makeCode();
    expect(code).toHaveLength(recoveryCodes.RECOVERY_CODE_LENTGH);
  });

  it('should create a recovery code list with the right amount', () => {
    const codes = recoveryCodes.generateRecoveryCodes();

    for (const code of codes) {
      expect(code).toHaveLength(recoveryCodes.RECOVERY_CODE_LENTGH);
    }
    expect(codes).toHaveLength(recoveryCodes.RECOVERY_CODES_AMOUNT);
  });
});
