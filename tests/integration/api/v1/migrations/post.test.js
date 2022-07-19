import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/migrations', () => {
  describe('Anonymous user', () => {
    test('Running pending migrations', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "create:migration".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with default features', () => {
    test('Running pending migrations', async () => {
      let defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      let defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "create:migration".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with "create:migration" feature', () => {
    test('Running pending migrations', async () => {
      let privilegedUser = await orchestrator.createUser();
      await orchestrator.activateUser(privilegedUser);
      await orchestrator.addFeaturesToUser(privilegedUser, ['create:migration']);

      let privilegedUserSession = await orchestrator.createSession(privilegedUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(Array.isArray(responseBody)).toEqual(true);
    });
  });
});
