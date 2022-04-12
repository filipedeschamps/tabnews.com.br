import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/migrations', () => {
  describe('Anonymous user', () => {
    test('Retrieving pending migrations', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`);

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:migration".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with default features', () => {
    test('Retrieving pending migrations', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      let defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:migration".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with "read:migration" feature', () => {
    let privilegedUser;
    let privilegedUserSession;

    beforeEach(async () => {
      privilegedUser = await orchestrator.createUser();
      privilegedUser = await orchestrator.activateUser(privilegedUser);
      privilegedUser = await orchestrator.addFeaturesToUser(privilegedUser, ['read:migration']);
      privilegedUserSession = await orchestrator.createSession(privilegedUser);
    });

    test('Retrieving pending migrations', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(Array.isArray(responseBody)).toEqual(true);
    });

    describe('Same user after losing "read:migration" feature', () => {
      test('Retrieving pending migrations ', async () => {
        await orchestrator.removeFeaturesFromUser(privilegedUser, ['read:migration']);

        const responseAfter = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${privilegedUserSession.token}`,
          },
        });

        const responseBody = await responseAfter.json();

        expect(responseAfter.status).toEqual(403);
        expect(responseBody.name).toEqual('ForbiddenError');
        expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
        expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:migration".');
        expect(responseBody.statusCode).toEqual(403);
        expect(uuidVersion(responseBody.errorId)).toEqual(4);
        expect(uuidValidate(responseBody.errorId)).toEqual(true);
        expect(uuidVersion(responseBody.requestId)).toEqual(4);
        expect(uuidValidate(responseBody.requestId)).toEqual(true);
        expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
      });
    });
  });
});
