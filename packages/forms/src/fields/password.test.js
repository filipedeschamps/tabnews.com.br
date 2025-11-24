import { password, passwordConfirmable, passwordConfirmation } from '.';
import { createConfirmation } from './password';

describe('forms', () => {
  describe('password fields', () => {
    it('should have the correct shape', () => {
      expect(password).toStrictEqual({
        value: '',
        label: 'Senha',
        placeholder: 'Digite sua senha',
        type: 'password',
        autoComplete: 'current-password',
        validateOnBlurAndSubmit: expect.any(Function),
      });

      expect(passwordConfirmable).toStrictEqual({
        value: '',
        label: 'Senha',
        placeholder: 'Crie uma senha',
        type: 'password',
        autoComplete: 'new-password',
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
      });

      expect(passwordConfirmation).toStrictEqual({
        value: '',
        label: 'Confirmação de senha',
        placeholder: 'Confirme sua senha',
        type: 'password',
        autoComplete: 'new-password',
        validateOnBlurAndSubmit: expect.any(Function),
        onValidChange: expect.any(Function),
      });
    });

    describe.each([password, passwordConfirmable, passwordConfirmation])(
      '$name validateOnBlurAndSubmit',
      ({ validateOnBlurAndSubmit }) => {
        it('should return an error message if password is less than 8 characters', () => {
          expect(validateOnBlurAndSubmit('')).toBe('Senha deve ter de 8 a 72 caracteres.');
          expect(validateOnBlurAndSubmit('short67')).toBe('Senha deve ter de 8 a 72 caracteres.');
        });

        it('should return an error message if password is more than 72 characters', () => {
          const longPassword = 'a'.repeat(73);
          expect(validateOnBlurAndSubmit(longPassword)).toBe('Senha deve ter de 8 a 72 caracteres.');
        });

        it('should return null if password is between 8 and 72 characters', () => {
          expect(validateOnBlurAndSubmit('p@ssw0rd')).toBeNull();
          expect(validateOnBlurAndSubmit('$'.repeat(72))).toBeNull();
        });
      },
    );

    describe('onValidChange', () => {
      it('should update the passwordConfirmation field with the correct validation function', () => {
        const updateFields = vi.fn();
        const value = 'p@ssw0rd';

        passwordConfirmable.onValidChange({ updateFields, value });

        expect(updateFields).toHaveBeenCalledWith({
          passwordConfirmation: { validateOnBlurAndSubmit: expect.any(Function), error: null },
        });
      });

      it('should update the passwordConfirmable field with the correct validation function', () => {
        const updateFields = vi.fn();
        const value = 'p@ssw0rd';

        passwordConfirmation.onValidChange({ updateFields, value });

        expect(updateFields).toHaveBeenCalledWith({
          passwordConfirmable: { validateOnBlurAndSubmit: expect.any(Function), error: null },
        });
      });
    });

    describe('createConfirmation should return a validation function that returns', () => {
      it('an error message if password is less than 8 characters', () => {
        const confirmation = createConfirmation('p@ssw0rd');
        expect(confirmation('')).toBe('Senha deve ter de 8 a 72 caracteres.');
        expect(confirmation('short67')).toBe('Senha deve ter de 8 a 72 caracteres.');
      });

      it('an error message if password is more than 72 characters', () => {
        const confirmation = createConfirmation('p@ssw0rd');
        const longPassword = 'a'.repeat(73);
        expect(confirmation(longPassword)).toBe('Senha deve ter de 8 a 72 caracteres.');
      });

      it('an error message if password does not match', () => {
        const confirmation = createConfirmation('p@ssw0rd');
        expect(confirmation('p@ssw0rd!')).toBe('Senhas não conferem.');
      });

      it('null if password is between 8 and 72 characters and matches', () => {
        const confirmation = createConfirmation('p@ssw0rd');
        expect(confirmation('p@ssw0rd')).toBeNull();
      });
    });
  });
});
