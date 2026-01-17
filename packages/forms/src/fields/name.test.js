import { fullName, username } from '.';

describe('forms', () => {
  describe('fullName field', () => {
    it('should have the correct shape', () => {
      expect(fullName).toStrictEqual({
        value: '',
        label: 'Nome completo',
        placeholder: 'Informe seu nome completo',
        autoComplete: 'name',
        autoCapitalize: 'words',
        prepare: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    it('should prepare name correctly', () => {
      expect(fullName.prepare('  john doe  ')).toBe('john doe');
    });

    it('should validate correctly', () => {
      expect(fullName.validateOnBlurAndSubmit('')).toBe('Nome completo inválido.');
      expect(fullName.validateOnBlurAndSubmit('John')).toBe('Nome completo inválido.');
      expect(fullName.validateOnBlurAndSubmit('John D')).toBe('Nome completo inválido.');
      expect(fullName.validateOnBlurAndSubmit('John Doe')).toBeNull();
      expect(fullName.validateOnBlurAndSubmit('John Doe Smith')).toBeNull();
      expect(fullName.validateOnBlurAndSubmit('John Doe'.repeat(8) + 'a')).toBe(
        'Nome completo deve ter no máximo 64 caracteres.',
      );
    });
  });

  describe('username field', () => {
    it('should have the correct shape', () => {
      expect(username).toStrictEqual({
        value: '',
        label: 'Nome de usuário',
        placeholder: 'n0mePubl1c0',
        autoComplete: 'username',
        autoCapitalize: 'none',
        format: expect.any(Function),
        validateOnBlurAndSubmit: expect.any(Function),
      });
    });

    it('should format username correctly', () => {
      expect(username.format('User@Name')).toBe('UserName');
      expect(username.format('user_name')).toBe('username');
      expect(username.format('user.name')).toBe('username');
      expect(username.format('username123')).toBe('username123');
    });

    it('should validate correctly', () => {
      expect(username.validateOnBlurAndSubmit('')).toBe('Nome de usuário deve ter de 3 a 30 caracteres alfanuméricos.');
      expect(username.validateOnBlurAndSubmit('ab')).toBe(
        'Nome de usuário deve ter de 3 a 30 caracteres alfanuméricos.',
      );
      expect(username.validateOnBlurAndSubmit('a'.repeat(31))).toBe(
        'Nome de usuário deve ter de 3 a 30 caracteres alfanuméricos.',
      );
      expect(username.validateOnBlurAndSubmit('abc')).toBeNull();
      expect(username.validateOnBlurAndSubmit('Va1idUsername23')).toBeNull();
      expect(username.validateOnBlurAndSubmit('a'.repeat(30))).toBeNull();
    });
  });
});
