import { brDocs } from './docs.js';

describe('forms', () => {
  describe('brDocs', () => {
    it('should have the correct shape', () => {
      expect(brDocs).toStrictEqual({
        value: '',
        label: 'CPF/CNPJ',
        placeholder: 'Informe seu CPF ou CNPJ',
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    describe('prepare', () => {
      it.each([
        ['valid CPF with only digits', '12345678909', '12345678909'],
        ['valid CPF with dots and dash', '123.456.789-09', '12345678909'],
        ['valid CPF with spaces', ' 123 478 900 00 ', '12347890000'],
        ['valid CPF with mixed separators', '123.478.900 00', '12347890000'],
      ])('should prepare %s', (_, input, expected) => {
        const result = brDocs.prepare(input);
        expect(result.number).toBe(expected);
        expect(result.type).toBe('CPF');
        expect(result).toStrictEqual({
          type: 'CPF',
          number: expected,
        });
      });

      it.each([
        ['valid CNPJ with only digits', '12345678000195', '12345678000195'],
        ['valid CNPJ with dots and dash', '12.345.678/0001-95', '12345678000195'],
        ['valid CNPJ with spaces', ' 12 345 678 00 01 95 ', '12345678000195'],
        ['valid CNPJ with mixed separators', '12.345.678 00 01 95', '12345678000195'],
      ])('should prepare %s', (_, input, expected) => {
        const result = brDocs.prepare(input);
        expect(result.number).toBe(expected);
        expect(result.type).toBe('CNPJ');
        expect(result).toStrictEqual({
          type: 'CNPJ',
          number: expected,
        });
      });

      it('should prepare an invalid document as PASSPORT', () => {
        const passport = 'A1234567';
        const result = brDocs.prepare(passport);
        expect(result).toStrictEqual({
          type: 'PASSPORT',
          number: passport,
        });
      });

      it('should prepare a passport with spaces', () => {
        const passport = ' AB1234567 ';
        const result = brDocs.prepare(passport);
        expect(result).toStrictEqual({
          type: 'PASSPORT',
          number: passport.trim(),
        });
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null for valid CPF', () => {
        const doc = { type: 'CPF', number: '12345678909' };
        const result = brDocs.validateOnBlurAndSubmit(doc);
        expect(result).toBeNull();
      });

      it('should return null for valid CNPJ', () => {
        const doc = { type: 'CNPJ', number: '12345678000195' };
        const result = brDocs.validateOnBlurAndSubmit(doc);
        expect(result).toBeNull();
      });

      it('should return null for valid PASSPORT', () => {
        const doc = { type: 'PASSPORT', number: 'A1234567' };
        const result = brDocs.validateOnBlurAndSubmit(doc);
        expect(result).toBeNull();
      });

      it('should return error message for long document number', () => {
        const doc = { type: 'PASSPORT', number: 'A' + '1234567890'.repeat(5) };
        const result = brDocs.validateOnBlurAndSubmit(doc);
        expect(result).toBe('Passaporte deve ter no máximo 50 caracteres.');
      });

      it('should return error message for empty document number', () => {
        const doc = { type: 'PASSPORT', number: '' };
        const result = brDocs.validateOnBlurAndSubmit(doc);
        expect(result).toBe('Informe um documento válido.');
      });
    });
  });
});
