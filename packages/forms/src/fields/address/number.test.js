import { number } from '.';

describe('forms', () => {
  describe('number field', () => {
    it('should have the correct shape', () => {
      expect(number).toStrictEqual({
        value: '',
        label: 'Número',
        placeholder: '000',
        inputMode: 'numeric',
        autoComplete: 'address-line1',
        format: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    describe('format', () => {
      it('should remove non-digit characters', () => {
        expect(number.format('123abc')).toBe('123');
        expect(number.format('abc123')).toBe('123');
        expect(number.format('12!@#34')).toBe('1234');
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null for non-empty input', () => {
        expect(number.validateOnBlurAndSubmit('123')).toBeNull();
      });

      it('should return error message for empty input', () => {
        expect(number.validateOnBlurAndSubmit('')).toBe('Informe o número.');
      });
    });
  });
});
