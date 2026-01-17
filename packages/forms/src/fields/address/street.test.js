import { street } from '.';

describe('forms', () => {
  describe('street field', () => {
    it('should have the correct shape', () => {
      expect(street).toStrictEqual({
        value: '',
        label: 'Endereço',
        placeholder: 'Rua / Avenida / Praça',
        autoComplete: 'street-address',
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    describe('prepare', () => {
      it('should trim the street', () => {
        const preparedCity = street.prepare('  São Paulo  ');
        expect(preparedCity).toBe('São Paulo');
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null for a non-empty street', () => {
        const validationResult = street.validateOnBlurAndSubmit('s');
        expect(validationResult).toBeNull();
      });

      it('should return an error message for an empty street', () => {
        const validationResult = street.validateOnBlurAndSubmit('');
        expect(validationResult).toBe('Informe um endereço válido.');
      });
    });
  });
});
