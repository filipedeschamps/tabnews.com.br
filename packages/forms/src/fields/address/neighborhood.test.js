import { neighborhood } from '.';

describe('forms', () => {
  describe('neighborhood field', () => {
    it('should have the correct shape', () => {
      expect(neighborhood).toStrictEqual({
        value: '',
        label: 'Bairro',
        placeholder: 'Qual é o seu bairro?',
        autoComplete: 'address-level3',
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    describe('prepare', () => {
      it('should trim the neighborhood', () => {
        const preparedCity = neighborhood.prepare('  Centro  ');
        expect(preparedCity).toBe('Centro');
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null for a non-empty neighborhood', () => {
        const validationResult = neighborhood.validateOnBlurAndSubmit('s');
        expect(validationResult).toBeNull();
      });

      it('should return an error message for an empty neighborhood', () => {
        const validationResult = neighborhood.validateOnBlurAndSubmit('');
        expect(validationResult).toBe('Informe seu bairro.');
      });
    });
  });
});
