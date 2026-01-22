import { isValidEmail, suggestEmail } from '@tabnews/helpers';

import { email, emailConfirmable, emailConfirmation } from '.';
import {
  confirmEmail,
  createConfirmation,
  createIgnorableValidator,
  createSuggestionObject,
  format,
  validateEmail,
} from './email';

vi.mock('@tabnews/helpers', () => ({
  isValidEmail: vi.fn(),
  suggestEmail: vi.fn(),
}));

describe('forms', () => {
  describe('email field', () => {
    it('should have the correct shape', () => {
      expect(email).toStrictEqual({
        value: '',
        label: 'Seu Email',
        placeholder: 'Digite seu email',
        type: 'email',
        autoComplete: 'email',
        format: expect.any(Function),
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
      });

      expect(emailConfirmable).toStrictEqual({
        value: '',
        label: 'Seu Email',
        placeholder: 'Digite seu email',
        type: 'email',
        autoComplete: 'email',
        format: expect.any(Function),
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
      });

      expect(emailConfirmation).toStrictEqual({
        value: '',
        label: 'Confirme seu Email',
        placeholder: 'Digite novamente seu email',
        type: 'email',
        autoComplete: 'email',
        format: expect.any(Function),
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
      });
    });

    it('should format email correctly', () => {
      expect(format(' Test@Email.Com ')).toBe('test@email.com');
    });

    it('should validate email correctly', () => {
      isValidEmail.mockReturnValueOnce(true);
      expect(validateEmail('test@email.com')).toBeNull();

      isValidEmail.mockReturnValueOnce(false);
      expect(validateEmail('invalid-email')).toBe('Email inválido.');

      isValidEmail.mockReturnValueOnce(true);
      expect(validateEmail('a'.repeat(65))).toBe('Email deve ter no máximo 64 caracteres.');
    });

    describe('createIgnorableValidator', () => {
      it('should create default ignorable validator', () => {
        const validator = createIgnorableValidator();

        isValidEmail.mockReturnValueOnce(true);
        suggestEmail.mockReturnValueOnce('fixable@gmail.com');
        expect(validator('fixable@gmeil.com')).toBe('Verifique a sugestão.');

        isValidEmail.mockReturnValueOnce(true);
        suggestEmail.mockReturnValueOnce(null);
        expect(validator('correct@gmail.com')).toBeNull();

        isValidEmail.mockReturnValueOnce(false);
        expect(validator('invalid-email')).toBe('Email inválido.');
      });

      it('should create ignorable validator correctly', () => {
        const validator = createIgnorableValidator('ignored@gmail.com');

        isValidEmail.mockReturnValueOnce(true);
        suggestEmail.mockReturnValueOnce('ignored@gmail.com');
        expect(validator('ignored@gmeil.com')).toBeNull();

        isValidEmail.mockReturnValueOnce(true);
        suggestEmail.mockReturnValueOnce(null);
        expect(validator('correct@gmail.com')).toBeNull();

        isValidEmail.mockReturnValueOnce(false);
        expect(validator('invalid-email')).toBe('Email inválido.');
      });
    });

    describe('confirmEmail', () => {
      it('should handle confirmEmail without "confirmationField"', () => {
        const updateFields = vi.fn();
        const handler = confirmEmail('email');
        handler({ updateFields, value: 'test@example.com' });

        expect(updateFields).toHaveBeenCalledWith({
          email: { suggestion: null },
        });
      });

      it('should handle confirmEmail correctly', () => {
        const updateFields = vi.fn();
        const handler = confirmEmail('emailConfirmable', 'emailConfirmation');
        handler({ updateFields, value: 'test@example.com' });

        expect(updateFields).toHaveBeenCalledWith({
          emailConfirmable: { suggestion: null },
          emailConfirmation: { validateOnBlurAndSubmit: expect.any(Function), error: null },
        });
      });

      it('should handle confirmEmail correctly when confirmationField is "emailConfirmable"', () => {
        const updateFields = vi.fn();
        const handler = confirmEmail('emailConfirmation', 'emailConfirmable');
        handler({ updateFields, value: 'test@example.com' });

        expect(updateFields).toHaveBeenCalledWith({
          emailConfirmation: { suggestion: null },
          emailConfirmable: { validateOnBlurAndSubmit: expect.any(Function), error: null },
        });
      });

      it('should handle confirmEmail correctly when confirmationField is updated to empty', () => {
        const updateFields = vi.fn();
        const handler = confirmEmail('emailConfirmation', 'emailConfirmable');
        handler({ updateFields, value: '' });

        expect(updateFields).toHaveBeenCalledWith({
          emailConfirmation: { suggestion: null },
          emailConfirmable: { validateOnBlurAndSubmit: validateEmail, error: null },
        });
      });
    });

    describe('createSuggestionObject', () => {
      it('should return null when field is "emailConfirmation"', () => {
        expect(createSuggestionObject({}, 'test', vi.fn(), 'emailConfirmation', 'emailConfirmable')).toBeNull();
      });

      it('should return null when suggestion is null', () => {
        suggestEmail.mockReturnValueOnce(null);
        expect(createSuggestionObject({}, 'test', vi.fn(), 'emailConfirmable', 'emailConfirmation')).toBeNull();
      });

      it('should return suggestion object correctly when suggestion is ignored', () => {
        const value = 'suggestion@example.com';
        suggestEmail.mockReturnValueOnce(value);
        const suggestion = createSuggestionObject(
          {
            emailConfirmable: { suggestion: { ignored: value } },
          },
          'test',
          vi.fn(),
          'emailConfirmable',
          'emailConfirmation',
        );

        expect(suggestion).toStrictEqual({
          ignored: value,
          value: null,
        });
      });

      it('should create suggestion object correctly without ignored suggestion', () => {
        const value = 'suggestion@example.com';
        suggestEmail.mockReturnValueOnce(value);
        const updateFields = vi.fn();
        const suggestion = createSuggestionObject(
          { emailConfirmable: {} },
          'test',
          updateFields,
          'emailConfirmable',
          'emailConfirmation',
        );

        expect(suggestion).toStrictEqual({
          value,
          pre: 'suggestion@',
          mid: 'example.com',
          onClick: expect.any(Function),
          ignoreClick: expect.any(Function),
        });

        suggestion.onClick({ preventDefault: vi.fn() });
        expect(updateFields).toHaveBeenCalledWith({
          emailConfirmable: {
            value,
            suggestion: null,
            error: null,
          },
          emailConfirmation: {
            validateOnBlurAndSubmit: expect.any(Function),
            error: null,
          },
        });

        suggestion.ignoreClick({ preventDefault: vi.fn() });
        expect(updateFields).toHaveBeenCalledWith({
          emailConfirmable: {
            suggestion: {
              ignored: value,
              value: null,
            },
            error: null,
            validateOnBlurAndSubmit: expect.any(Function),
          },
        });
      });

      it('should create suggestion object correctly without "emailConfirmation"', () => {
        const value = 'suggestion@example.com';
        suggestEmail.mockReturnValueOnce(value);
        const updateFields = vi.fn();
        const suggestion = createSuggestionObject({ email: {} }, 'test', updateFields, 'email');

        expect(suggestion).toStrictEqual({
          value,
          pre: 'suggestion@',
          mid: 'example.com',
          onClick: expect.any(Function),
          ignoreClick: expect.any(Function),
        });

        suggestion.onClick({ preventDefault: vi.fn() });
        expect(updateFields).toHaveBeenCalledWith({
          email: {
            value,
            suggestion: null,
            error: null,
          },
        });

        suggestion.ignoreClick({ preventDefault: vi.fn() });
        expect(updateFields).toHaveBeenCalledWith({
          email: {
            suggestion: {
              ignored: value,
              value: null,
            },
            error: null,
            validateOnBlurAndSubmit: expect.any(Function),
          },
        });
      });
    });

    it('should create confirmation function correctly', () => {
      const validate = createConfirmation('expected@example.com');

      isValidEmail.mockReturnValueOnce(true);
      expect(validate('expected@example.com')).toBeNull();

      isValidEmail.mockReturnValueOnce(true);
      expect(validate('wrong@example.com')).toBe('Emails não conferem.');

      isValidEmail.mockReturnValueOnce(false);
      expect(validate('invalid-email')).toBe('Email inválido.');

      isValidEmail.mockReturnValueOnce(true);
      expect(validate('a'.repeat(65))).toBe('Email deve ter no máximo 64 caracteres.');
    });
  });
});
