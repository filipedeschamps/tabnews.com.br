import authorization from 'models/authorization.js';

function expectToThrowError(fn) {
  try {
    fn();
    assert.fail('Should have thrown an error');
  } catch (error) {
    return error;
  }
}

describe('models/authorization', () => {
  describe('can', () => {
    describe('Input Validation', () => {
      it('should throw "ValidationError" if user is null', () => {
        const error = expectToThrowError(() => authorization.can(null, 'update:user'));
        expect(error).toMatchObject({
          name: 'ValidationError',
          statusCode: 400,
          message: 'Nenhum "user" foi especificado para a ação de autorização.',
          action: 'Contate o suporte informando o campo "errorId".',
          errorId: expect.any(String),
        });
      });

      it('should throw "ValidationError" if "user.features" is undefined', () => {
        const error = expectToThrowError(() => authorization.can({ id: 'user-id' }, 'update:user'));
        expect(error).toMatchObject({
          name: 'ValidationError',
          statusCode: 400,
          message: '"user" não possui "features" ou não é um array.',
          action: 'Contate o suporte informando o campo "errorId".',
          errorId: expect.any(String),
        });
      });

      it('should throw "ValidationError" if "user.features" is not an array', () => {
        const error = expectToThrowError(() => authorization.can({ id: 'user-id', features: 'string' }, 'update:user'));
        expect(error).toMatchObject({
          name: 'ValidationError',
          statusCode: 400,
          message: '"user" não possui "features" ou não é um array.',
          action: 'Contate o suporte informando o campo "errorId".',
          errorId: expect.any(String),
        });
      });

      it('should throw "ValidationError" if "feature" is null', () => {
        const error = expectToThrowError(() => authorization.can({ id: 'user-id', features: ['update:user'] }, null));
        expect(error).toMatchObject({
          name: 'ValidationError',
          statusCode: 400,
          message: 'Nenhuma "feature" foi especificada para a ação de autorização.',
          action: 'Contate o suporte informando o campo "errorId".',
          errorId: expect.any(String),
        });
      });

      it('should throw "ValidationError" if "feature" does not exist in list', () => {
        const error = expectToThrowError(() =>
          authorization.can({ id: 'user-id', features: ['update:user'] }, 'feature:nonexistent'),
        );
        expect(error).toMatchObject({
          name: 'ValidationError',
          statusCode: 400,
          message: 'A feature utilizada não está disponível na lista de features existentes.',
          action: 'Contate o suporte informando o campo "errorId".',
          context: { feature: 'feature:nonexistent' },
          errorId: expect.any(String),
        });
      });
    });

    describe('Basic Permission Logic', () => {
      it('should return false when user does not have features', () => {
        const user = { id: 'user-id', features: [] };
        expect(authorization.can(user, 'update:user')).toBe(false);
      });

      it('should return false when user has other features but not the requested one', () => {
        const user = { id: 'user-id', features: ['create:user', 'read:user'] };
        expect(authorization.can(user, 'update:user')).toBe(false);
      });

      it('should return true when user have the requested feature and "resource" is undefined', () => {
        const user = { id: 'user-id', features: ['create:user', 'read:user'] };
        expect(authorization.can(user, 'read:user')).toBe(true);
      });

      it('should return true when user have the requested feature and "resource" is "null"', () => {
        const user = { id: 'user-id', features: ['create:user'] };
        expect(authorization.can(user, 'create:user', null)).toBe(true);
      });

      it('should return false when "resource" is provided', () => {
        const user = { id: 'user-id', features: ['create:user'] };
        expect(authorization.can(user, 'create:user', { id: 'other-user-id' })).toBe(false);
      });
    });

    describe('Specific Logic - update:user', () => {
      it('should return true when user owns the profile', () => {
        const user = { id: 'user-id', features: ['update:user'] };
        const resource = { id: 'user-id' };
        expect(authorization.can(user, 'update:user', resource)).toBe(true);
      });

      it('should return false when user does not own the profile', () => {
        const user = { id: 'user-id', features: ['update:user'] };
        const resource = { id: 'other-user-id' };
        expect(authorization.can(user, 'update:user', resource)).toBe(false);
      });

      it('should return false when resource is null', () => {
        const user = { id: 'user-id', features: ['update:user'] };
        expect(authorization.can(user, 'update:user', null)).toBe(false);
      });

      it('should return false when resource has no id property', () => {
        const user = { id: 'user-id', features: ['update:user'] };
        expect(authorization.can(user, 'update:user', {})).toBe(false);
      });
    });

    describe('Specific Logic - update:content', () => {
      it('should return true when user owns the content', () => {
        const user = { id: 'content-id', features: ['update:content'] };
        const resource = { owner_id: 'content-id' };
        expect(authorization.can(user, 'update:content', resource)).toBe(true);
      });

      it('should return true when user does not own content but has "update:content:others" feature', () => {
        const user = {
          id: 'content-id',
          features: ['update:content', 'update:content:others'],
        };
        const resource = { owner_id: 'other-content-id' };
        expect(authorization.can(user, 'update:content', resource)).toBe(true);
      });

      it('should return true when user has "update:content:others" feature even with null "resource"', () => {
        const user = {
          id: 'content-id',
          features: ['update:content', 'update:content:others'],
        };
        expect(authorization.can(user, 'update:content', null)).toBe(true);
      });

      it('should return false when user does not own content and does not have "update:content:others"', () => {
        const user = { id: 'content-id', features: ['update:content'] };
        const resource = { owner_id: 'other-content-id' };
        expect(authorization.can(user, 'update:content', resource)).toBe(false);
      });

      it('should return false when "resource" "owner_id" is null', () => {
        const user = { id: 'content-id', features: ['update:content'] };
        expect(authorization.can(user, 'update:content', { owner_id: null })).toBe(false);
      });

      it('should return false when "resource" has no "owner_id" property', () => {
        const user = { id: 'content-id', features: ['update:content'] };
        expect(authorization.can(user, 'update:content', {})).toBe(false);
      });

      it('should return false when "resource" is null', () => {
        const user = { id: 'content-id', features: ['update:content'] };
        expect(authorization.can(user, 'update:content', null)).toBe(false);
      });
    });
  });
});
