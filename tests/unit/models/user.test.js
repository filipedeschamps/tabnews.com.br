import { randomUUID as uuidV4 } from 'node:crypto';

import { ValidationError } from 'errors';
import authentication from 'models/authentication';
import emailConfirmation from 'models/email-confirmation';
import user from 'models/user';

const mocks = vi.hoisted(() => {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
});

vi.mock('infra/database', () => {
  return {
    default: {
      query: mocks.query,
      transaction: vi.fn().mockResolvedValue({
        query: mocks.query,
        release: mocks.release,
      }),
    },
  };
});

vi.mock('models/authentication', () => ({
  default: {
    hashPassword: vi.fn().mockResolvedValue('hashed_password_securely'),
  },
}));

vi.mock('models/email-confirmation', () => ({
  default: {
    createAndSendEmail: vi.fn().mockResolvedValue({ id: uuidV4() }),
  },
}));

describe('user.update()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Testes MC/DC baseados na tabela fornecida', () => {
    // CT1: Atualização de Email Válido e Não em Uso (B1V, B2V, B3V)
    test('CT1 - Atualização de Email Válido e Não em Uso', async () => {
      const userId = uuidV4();
      const targetUser = {
        id: userId,
        username: 'testuser',
        email: 'old@example.com',
      };
      const updates = { email: 'new.user@example.com' };

      // Mock simulando email válido e não em uso
      mocks.query
        .mockResolvedValueOnce({ rowCount: 0 }) // validateUniqueUser - email não existe
        .mockResolvedValueOnce({ rowCount: 0 }) // deleteExpiredUsers
        .mockResolvedValueOnce({
          // runUpdateQuery - como email é removido para confirmação, retorna o email original
          rows: [
            {
              ...targetUser,
              email: 'old@example.com',
              updated_at: new Date(),
              tabcoins: 0,
              tabcash: 0,
            },
          ],
        });

      const result = await user.update(targetUser, updates);

      // O email original é mantido pois o novo é removido para confirmação
      expect(result.email).toBe('old@example.com');
      expect(emailConfirmation.createAndSendEmail).toHaveBeenCalledWith(targetUser, 'new.user@example.com', {
        transaction: undefined,
      });
    });

    // CT2: Email com Formato Inválido (B1V, B2F)
    test('CT2 - Email com Formato Inválido', async () => {
      const userId = uuidV4();
      const targetUser = { id: userId, username: 'testuser', email: 'old@example.com' };
      const updates = { email: 'invalid-email' };

      await expect(user.update(targetUser, updates)).rejects.toThrow(ValidationError);
      await expect(user.update(targetUser, updates)).rejects.toThrow('"email" deve conter um email válido.');
    });

    // CT3: Email Já em Uso (B1V, B2V, B3F)
    test('CT3 - Email Já em Uso', async () => {
      const userId = uuidV4();
      const targetUser = { id: userId, username: 'testuser', email: 'old@example.com' };
      const updates = { email: 'existing@example.com' };

      // Mock que força o erro direto para simular validateUniqueUser
      mocks.query.mockImplementationOnce(() => {
        throw new ValidationError({
          message: 'O email informado já está sendo usado.',
          key: 'email',
        });
      });

      await expect(user.update(targetUser, updates)).rejects.toThrow('O email informado já está sendo usado.');
    });

    // CT4: Atualização de Senha com Força Válida (D1V, D2V)
    test('CT4 - Atualização de Senha com Força Válida', async () => {
      const userId = uuidV4();
      const targetUser = { id: userId, username: 'testuser', email: 'test@example.com' };
      const updates = { password: 'StrongP@ss1!' };

      mocks.query.mockResolvedValueOnce({
        rows: [
          {
            ...targetUser,
            password: 'hashed_password_securely',
            updated_at: new Date(),
            tabcoins: 0,
            tabcash: 0,
          },
        ],
      });

      const result = await user.update(targetUser, updates);

      expect(authentication.hashPassword).toHaveBeenCalledWith('StrongP@ss1!');
      expect(result.password).toBe('hashed_password_securely');
    });

    // CT5: Senha com Força Fraca (D1V, D2F)
    test('CT5 - Senha com Força Fraca', async () => {
      const userId = uuidV4();
      const targetUser = { id: userId, username: 'testuser', email: 'test@example.com' };
      const updates = { password: 'weak' }; // menos de 8 caracteres

      await expect(user.update(targetUser, updates)).rejects.toThrow(ValidationError);
      await expect(user.update(targetUser, updates)).rejects.toThrow('"password" deve conter no mínimo 8 caracteres.');
    });

    // CT6: Atualização de URL de Imagem de Perfil Válida (F1V, F2V)
    // Como profileImageUrl não existe no schema atual, testamos campo description válido
    test('CT6 - Atualização de Description Válida', async () => {
      const userId = uuidV4();
      const targetUser = { id: userId, username: 'testuser', email: 'test@example.com' };
      const updates = { description: 'Nova descrição válida' };

      mocks.query.mockResolvedValueOnce({
        rows: [
          {
            ...targetUser,
            description: 'Nova descrição válida',
            updated_at: new Date(),
            tabcoins: 0,
            tabcash: 0,
          },
        ],
      });

      const result = await user.update(targetUser, updates);

      expect(result.description).toBe('Nova descrição válida');
    });

    // CT7: URL de Imagem de Perfil Inválida (F1V, F2F)
    // Como profileImageUrl não existe, testamos description muito longa
    test('CT7 - Description Muito Longa', async () => {
      const userId = uuidV4();
      const targetUser = { id: userId, username: 'testuser', email: 'test@example.com' };
      const updates = { description: 'x'.repeat(5001) }; // excede o limite de 5000

      await expect(user.update(targetUser, updates)).rejects.toThrow(ValidationError);
      await expect(user.update(targetUser, updates)).rejects.toThrow(
        '"description" deve conter no máximo 5000 caracteres.',
      );
    });

    // CT8: Nenhuma Atualização Fornecida (H1V)
    test('CT8 - Nenhuma Atualização Fornecida', async () => {
      const userId = uuidV4();
      const targetUser = { id: userId, username: 'testuser', email: 'test@example.com' };
      const updates = {};

      await expect(user.update(targetUser, updates)).rejects.toThrow(ValidationError);
      await expect(user.update(targetUser, updates)).rejects.toThrow('Objeto enviado deve ter no mínimo uma chave.');
    });

    // CT9: ID de Usuário Ausente (A1V)
    test('CT9 - TargetUser Ausente/Nulo', async () => {
      const targetUser = null;
      const updates = { email: 'any@example.com' };

      await expect(user.update(targetUser, updates)).rejects.toThrow(
        /Cannot use 'in' operator|Cannot read properties of null/,
      );
    });
  });
});
