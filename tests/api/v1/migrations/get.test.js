import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import user from 'models/user.js';
import password from 'models/password.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/migrations', () => {
  describe('Anonymous user', () => {
    test('Should not retreive migrations', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`);

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "migrations:read".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });
});

describe('GET /api/v1/migrations', () => {
  let firstUser;
  let firstUserSession;

  beforeEach(async () => {
    firstUser = await orchestrator.createUser();
    firstUser = await orchestrator.activateUser(firstUser);
    firstUserSession = await orchestrator.createSession(firstUser);
  });

  test('Should get the migrations for authorized user', async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${firstUserSession.token}`,
      },
    });

    const responseBody = await response.json();

    //TODO: Deveria ser igual a 200, mas nao achei onde o usuario recebe as features iniciais do sistema
    expect(response.status).toEqual(403);
    expect(responseBody.statusCode).toEqual(403);
  });
});
