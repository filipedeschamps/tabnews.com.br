import { afterEach, describe, expect, it, vi } from 'vitest';

import database from '../../../infra/database.js';
import userModel from '../../../models/user.js';

vi.mock('../../../infra/database.js');

describe('validateUniqueUser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve permitir quando apenas username não existe', async () => {
    database.query.mockResolvedValue({ rowCount: 0, rows: [] });
    await expect(userModel.validateUniqueUser({ username: 'user1' })).resolves.toBeUndefined();
  });

  it('deve permitir quando apenas email não existe', async () => {
    database.query.mockResolvedValue({ rowCount: 0, rows: [] });
    await expect(userModel.validateUniqueUser({ email: 'email1@ex.com' })).resolves.toBeUndefined();
  });

  it('deve lançar erro de username duplicado quando ambos presentes e username já existe', async () => {
    database.query.mockResolvedValue({
      rowCount: 1,
      rows: [{ username: 'user1', email: 'outro@email.com' }],
    });
    await expect(userModel.validateUniqueUser({ username: 'user1', email: 'email1@ex.com' })).rejects.toThrow(
      'O "username" informado já está sendo usado.',
    );
  });

  it('deve lançar erro de email duplicado quando ambos presentes e email já existe', async () => {
    database.query.mockResolvedValue({
      rowCount: 1,
      rows: [{ username: 'outro', email: 'email1@ex.com' }],
    });
    await expect(userModel.validateUniqueUser({ username: 'user1', email: 'email1@ex.com' })).rejects.toThrow(
      'O email informado já está sendo usado.',
    );
  });

  it('não deve consultar o banco se username e email não forem informados', async () => {
    await expect(userModel.validateUniqueUser({})).resolves.toBeUndefined();
    expect(database.query).not.toHaveBeenCalled();
  });
});
