import { complement } from '.';

describe('forms', () => {
  describe('complement field', () => {
    it('should have the correct shape', () => {
      expect(complement).toStrictEqual({
        value: '',
        label: 'Complemento (opcional)',
        placeholder: 'Apartamento / Bloco / Fundos',
        autoComplete: 'address-line2',
        prepare: expect.any(Function),
      });
    });

    describe('prepare', () => {
      it('should trim the complement', () => {
        const preparedCity = complement.prepare('  Ap 123  ');
        expect(preparedCity).toBe('Ap 123');
      });
    });
  });
});
