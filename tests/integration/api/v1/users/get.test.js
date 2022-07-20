import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users', () => {
  describe('Anonymous user', () => {
    test('Anonymous user trying to retrieve user list', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      let privilegedUser = await orchestrator.createUser();
      privilegedUser = await orchestrator.activateUser(privilegedUser);
      privilegedUser = await orchestrator.addFeaturesToUser(privilegedUser, ['read:user:list']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`);
      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:user:list".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('Default user', () => {
    test('User without "read:user:list" feature', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      let privilegedUser = await orchestrator.createUser();
      privilegedUser = await orchestrator.activateUser(privilegedUser);
      privilegedUser = await orchestrator.addFeaturesToUser(privilegedUser, ['read:user:list']);

      let defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
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
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:user:list".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with "read:user:list" feature', () => {
    test('Retrieving user list with users', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      let privilegedUser = await orchestrator.createUser();
      privilegedUser = await orchestrator.activateUser(privilegedUser);
      privilegedUser = await orchestrator.addFeaturesToUser(privilegedUser, ['read:user:list']);

      let privilegedUserSession = await orchestrator.createSession(privilegedUser);

      const firstUser = {
        id: defaultUser.id,
        username: defaultUser.username,
        features: defaultUser.features,
        tabcoins: defaultUser.tabcoins,
        tabcash: defaultUser.tabcash,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: defaultUser.updated_at.toISOString(),
      };
      const secondUser = {
        id: privilegedUser.id,
        username: privilegedUser.username,
        features: privilegedUser.features,
        tabcoins: privilegedUser.tabcoins,
        tabcash: privilegedUser.tabcash,
        created_at: privilegedUser.created_at.toISOString(),
        updated_at: privilegedUser.updated_at.toISOString(),
      };

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual(expect.arrayContaining([firstUser, secondUser]));

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(Date.parse(responseBody[0].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].updated_at)).not.toEqual(NaN);
      expect(responseBody[0]).not.toHaveProperty('password');
      expect(responseBody[0]).not.toHaveProperty('email');

      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(Date.parse(responseBody[1].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].updated_at)).not.toEqual(NaN);
      expect(responseBody[1]).not.toHaveProperty('password');
      expect(responseBody[1]).not.toHaveProperty('email');
    });
  });
});
