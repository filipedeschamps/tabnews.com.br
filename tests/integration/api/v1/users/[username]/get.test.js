import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('Retrieving non-existing user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist`);

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.error_location_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving too short user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/ab`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no mínimo 3 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving too long user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userWith31Characterssssssssssss`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no máximo 30 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving user with invalid characters', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/<script>alert("xss")`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving existing user using same capital letters', async () => {
      const userCreated = await orchestrator.createUser({
        username: 'userNameToBeFound',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userNameToBeFound`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: userCreated.id,
        username: 'userNameToBeFound',
        features: userCreated.features,
        tabcoins: userCreated.tabcoins,
        tabcash: userCreated.tabcash,
        created_at: userCreated.created_at.toISOString(),
        updated_at: userCreated.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('email');
    });

    test('Retrieving existing user using different capital letters', async () => {
      const userCreated = await orchestrator.createUser({
        username: 'userNameToBeFoundCAPS',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/usernametobefoundcaps`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: userCreated.id,
        username: 'userNameToBeFoundCAPS',
        features: userCreated.features,
        tabcoins: userCreated.tabcoins,
        tabcash: userCreated.tabcash,
        created_at: userCreated.created_at.toISOString(),
        updated_at: userCreated.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('email');
    });
  });
});
