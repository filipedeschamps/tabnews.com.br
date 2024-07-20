import { ValidationError } from 'errors';
import authorization from 'models/authorization';

const { validateUser } = authorization;

describe('Authorization', () => {
  describe('validateUser', () => {
    describe('Caso de Teste (ID.1)', () => {
      it('1. deveria lançar um erro se o usuário não for especificado', () => {
        expect(() => validateUser(null)).toThrowError(
          new ValidationError({
            message: `Nenhum "user" foi especificado para a ação de autorização.`,
            action: `Contate o suporte informado o campo "errorId".`,
          }),
        );
      });
      it('2. deveria lançar um erro se o usuário não possuir features', () => {
        expect(() => validateUser({})).toThrowError(
          new ValidationError({
            message: `"user" não possui "features" ou não é um array.`,
            action: `Contate o suporte informado o campo "errorId".`,
          }),
        );
      });
    });
    describe('Caso de Teste (ID.2)', () => {
      it('1. deveria lançar um erro se o usuário não possuir features', () => {
        expect(() => validateUser({})).toThrowError(
          new ValidationError({
            message: `"user" não possui "features" ou não é um array.`,
            action: `Contate o suporte informado o campo "errorId".`,
          }),
        );
      });
      it('2. deveria lançar um erro se o usuário não possuir uma lista de features', () => {
        expect(() => validateUser({ features: '' })).toThrowError(
          new ValidationError({
            message: `"user" não possui "features" ou não é um array.`,
            action: `Contate o suporte informado o campo "errorId".`,
          }),
        );
      });
      it('3.deveria validar um usuário com features', () => {
        expect(() => validateUser({ features: [] })).not.toThrow();
      });
    });
  });
});
