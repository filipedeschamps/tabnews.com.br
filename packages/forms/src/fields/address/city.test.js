import { city } from '.';

describe('forms', () => {
  describe('city field', () => {
    it('should have the correct shape', () => {
      expect(city).toStrictEqual({
        value: '',
        label: 'Cidade',
        placeholder: 'Onde você mora?',
        autoComplete: 'address-level2',
        autoCapitalize: 'words',
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    describe('prepare', () => {
      it('should trim the city name', () => {
        expect(city.prepare('  São Paulo  ')).toBe('São Paulo');
      });
    });

    describe('validateOnBlurAndSubmit', () => {
      it('should return null for a non-empty city name', () => {
        expect(city.validateOnBlurAndSubmit('s')).toBeNull();
      });

      it('should return an error message for an empty city name', () => {
        expect(city.validateOnBlurAndSubmit('')).toBe('Informe sua cidade.');
      });
    });
  });
});
