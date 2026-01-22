import { phone } from '.';
import {
  extractPhoneNumber,
  maskPhone,
  validateCountryCode,
  validateOnChange,
  validatePhoneCodes,
  validatePhoneLength,
  validatePhoneNumber,
  validatePhoneObject,
} from './phone';

describe('forms', () => {
  describe('phone field', () => {
    it('should have the correct shape', () => {
      expect(phone).toStrictEqual({
        label: 'Celular',
        value: '',
        placeholder: 'Informe seu telefone',
        type: 'tel',
        autoComplete: 'tel',
        format: maskPhone,
        prepare: extractPhoneNumber,
        validateOnChange,
        validateOnBlurAndSubmit: validatePhoneObject,
      });
    });

    describe('maskPhone', () => {
      it('should remove/replace invalid characters', () => {
        const result = maskPhone('+abc1(2+3)!4@#5-6$7 %8^9&0*><?');
        expect(result).toBe('+1(23)45-67-890');
      });

      it('should be able to start with a plus sign (+)', () => {
        expect(maskPhone('+')).toBe('+');
        expect(maskPhone('+3')).toBe('+3');
        expect(maskPhone('++5')).toBe('+5');
        expect(maskPhone('+987')).toBe('+987');
        expect(maskPhone('+8765')).toBe('+876(5');
        expect(maskPhone('+7(6)54')).toBe('+7(6)54');
      });

      it('should be able to start with a numeric character (no country code)', () => {
        expect(maskPhone('1')).toBe('(1');
        expect(maskPhone('21')).toBe('(21');
        expect(maskPhone('351')).toBe('(35)1');
      });

      it('should be able to start with opening parentheses', () => {
        expect(maskPhone('(')).toBe('(');
        expect(maskPhone('(1')).toBe('(1');
        expect(maskPhone('(21')).toBe('(21');
        expect(maskPhone('((21')).toBe('(21');
      });

      it('should replace initial characters with opening parentheses', () => {
        expect(maskPhone(' ')).toBe('');
        expect(maskPhone('  ')).toBe('');
        expect(maskPhone(')')).toBe('(');
        expect(maskPhone('-')).toBe('(');
        expect(maskPhone(' 1')).toBe('(1');
        expect(maskPhone(')2')).toBe('(2');
        expect(maskPhone('-4')).toBe('(4');
        expect(maskPhone(' 21')).toBe('(21');
        expect(maskPhone(')32')).toBe('(32');
        expect(maskPhone('-43')).toBe('(43');
        expect(maskPhone('  21')).toBe('(21');
        expect(maskPhone('))32')).toBe('(32');
        expect(maskPhone('--43')).toBe('(43');
        expect(maskPhone(' -)43')).toBe('(43');
      });

      it('should be able to recognize some country codes', () => {
        expect(maskPhone('+16')).toBe('+1(6');
        expect(maskPhone('+554')).toBe('+55(4');
        expect(maskPhone('+3512')).toBe('+351(2');
      });

      it('should add area code parentheses', () => {
        expect(maskPhone('2191')).toBe('(21)91');
        expect(maskPhone('11998765432')).toBe('(11)998765432');
        expect(maskPhone('1199876-5432')).toBe('(11)99876-5432');
        expect(maskPhone('119987 65432')).toBe('(11)9987-65432');
        expect(maskPhone('+17')).toBe('+1(7');
        expect(maskPhone('+2345')).toBe('+234(5');
        expect(maskPhone('+55219')).toBe('+55(21)9');
        expect(maskPhone('+5511998765432')).toBe('+55(11)998765432');
        expect(maskPhone('+55 11 99876 5432')).toBe('+55(11)99876-5432');
        expect(maskPhone('+  55  11  998765432')).toBe('+55(11)998765432');
        expect(maskPhone(' +  55  (11)  998(765)432')).toBe('+55(11)998765432');
        expect(maskPhone('  +  55  11  99876-5432')).toBe('+55(11)99876-5432');
      });

      it('should handle input with extra parentheses', () => {
        expect(maskPhone('11998(765)432')).toBe('(11)998765432');
        expect(maskPhone('+55 (11) 99876 (5432)')).toBe('+55(11)99876-5432');
        expect(maskPhone('+55(1(1)99876-5432')).toBe('+55(11)99876-5432');
        expect(maskPhone('+55(11)9)9876-5432')).toBe('+55(11)99876-5432');
      });
    });

    describe('validateCountryCode', () => {
      it('should return null for valid country code', () => {
        expect(validateCountryCode({ country_code: '1' })).toBeNull();
        expect(validateCountryCode({ country_code: '55' })).toBeNull();
        expect(validateCountryCode({ country_code: '351' })).toBeNull();
      });

      it('should return error message for invalid country code', () => {
        expect(validateCountryCode({ country_code: '' })).toBe('Utilize o formato +55(DDD)N ou (DDD)N.');
        expect(validateCountryCode({ country_code: '1234' })).toBe('Utilize o formato +55(DDD)N ou (DDD)N.');
        expect(validateCountryCode({ country_code: 'x' })).toBe('Utilize o formato +55(DDD)N ou (DDD)N.');
      });
    });

    describe('extractPhoneNumber', () => {
      it('should extract country code, area code, and number correctly', () => {
        const result = extractPhoneNumber('+1 (212) 555-1212');
        expect(result).toStrictEqual({
          country_code: '1',
          area_code: '212',
          number: '5551212',
        });
      });

      it('should handle numbers without country code', () => {
        const result = extractPhoneNumber('(21) 99876-5432');
        expect(result).toStrictEqual({
          country_code: '55',
          area_code: '21',
          number: '998765432',
        });
      });

      it('should not handle numbers without area code', () => {
        const result = extractPhoneNumber('+55199876-5432');
        expect(result).toStrictEqual({
          country_code: '551998765432',
          area_code: '',
          number: '',
        });
      });

      it('should handle numbers without country code and area code', () => {
        const result = extractPhoneNumber('99876-5432');
        expect(result).toStrictEqual({
          country_code: '55',
          area_code: '',
          number: '998765432',
        });
      });

      it('should handle numbers with invalid characters', () => {
        const result = extractPhoneNumber('+ + 55(21) 99% 876-5432abc');
        expect(result).toStrictEqual({
          country_code: '55',
          area_code: '21',
          number: '998765432',
        });
      });
    });

    describe('validatePhoneCodes', () => {
      it('should return null for valid codes', () => {
        expect(validatePhoneCodes({ area_code: '1', country_code: '4' })).toBeNull();
      });

      it('should return error message for invalid area code', () => {
        const errorMessage = 'Código de área inválido. Insira o DDD entre parênteses.';

        expect(validatePhoneCodes({ area_code: '' })).toBe(errorMessage);
        expect(validatePhoneCodes({ area_code: 'w' })).toBe(errorMessage);
        expect(validatePhoneCodes({ area_code: '+' })).toBe(errorMessage);
      });

      it('should return error message for invalid country code', () => {
        const errorMessage = 'Utilize o formato +55(DDD)N ou (DDD)N.';

        expect(validatePhoneCodes({ area_code: '1', country_code: '' })).toBe(errorMessage);
        expect(validatePhoneCodes({ area_code: '2', country_code: '1234' })).toBe(errorMessage);
        expect(validatePhoneCodes({ area_code: '3', country_code: 'x' })).toBe(errorMessage);
      });
    });

    describe('validatePhoneLength', () => {
      it('should return null for valid phone number', () => {
        expect(validatePhoneLength({ country_code: '1', area_code: '2', number: '3456789012345' })).toBeNull();
      });

      it('should return error message for long phone number', () => {
        expect(validatePhoneLength({ country_code: '1', area_code: '2', number: '34567890123456' })).toBe(
          'Telefone deve ter no máximo 15 dígitos.',
        );
      });
    });

    describe('validatePhoneNumber', () => {
      it('should return null for valid phone number', () => {
        expect(validatePhoneNumber({ number: '123456' })).toBeNull();
      });

      it('should return error message for short phone number', () => {
        expect(validatePhoneNumber({ number: '12345' })).toBe('Número muito curto.');
      });
    });

    describe('validatePhoneObject', () => {
      it('should return null for valid phone number', () => {
        expect(validatePhoneObject({ area_code: '1', country_code: '4', number: '123456' })).toBeNull();
      });

      it('should return error message for invalid area code', () => {
        const errorMessage = 'Código de área inválido. Insira o DDD entre parênteses.';

        expect(validatePhoneObject({ area_code: '' })).toBe(errorMessage);
        expect(validatePhoneObject({ area_code: 'w' })).toBe(errorMessage);
        expect(validatePhoneObject({ area_code: '+' })).toBe(errorMessage);
      });

      it('should return error message for invalid country code', () => {
        const errorMessage = 'Utilize o formato +55(DDD)N ou (DDD)N.';

        expect(validatePhoneObject({ area_code: '1', country_code: '' })).toBe(errorMessage);
        expect(validatePhoneObject({ area_code: '2', country_code: '1234' })).toBe(errorMessage);
        expect(validatePhoneObject({ area_code: '3', country_code: 'x' })).toBe(errorMessage);
      });

      it('should return error message for short phone number', () => {
        expect(validatePhoneObject({ area_code: '1', country_code: '4', number: '12345' })).toBe('Número muito curto.');
      });
    });

    describe('validateOnChange', () => {
      it('should return null for incomplete phone number', () => {
        expect(validateOnChange('+1')).toBeNull();
        expect(validateOnChange('+1(1')).toBeNull();
        expect(validateOnChange('+321(1')).toBeNull();
        expect(validateOnChange('+321(1234')).toBeNull();
        expect(validateOnChange('(1')).toBeNull();
        expect(validateOnChange('(41')).toBeNull();
        expect(validateOnChange('(55)9')).toBeNull();
      });

      it('should return null for valid phone number', () => {
        expect(validateOnChange('+1 (212) 555-1212')).toBeNull();
      });

      it('should return error message for invalid country code', () => {
        const errorMessage = 'Utilize o formato +55(DDD)N ou (DDD)N.';

        expect(validateOnChange('+9876(2)')).toBe(errorMessage);
        expect(validateOnChange('+1 555')).toBe(errorMessage);
      });
    });
  });
});
