import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users/[username].public.js', () => {
  describe('Anonymous user', () => {
    test('Retrieving user that not exists', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist`);
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O username "donotexist" não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });

    test('Retrieving user that does exists using same capital letters', async () => {
      const userCreatedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'userNameToBeFound',
          email: 'userEmail@gmail.com',
          password: 'validpassword',
        }),
      });

      const userCreatedResponseBody = await userCreatedResponse.json();

      const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userNameToBeFound`);
      const userFindResponseBody = await userFindResponse.json();

      expect(userFindResponse.status).toEqual(200);
      expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
      expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
      expect(userCreatedResponseBody.id).toEqual(userFindResponseBody.id);
      expect(userFindResponseBody.username).toEqual('userNameToBeFound');
      expect(userFindResponseBody.features).toEqual(['read:activation_token', 'read:user', 'read:users']);
      expect(Date.parse(userFindResponseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(userFindResponseBody.created_at)).not.toEqual(NaN);
      expect(userFindResponseBody).not.toHaveProperty('password');
      expect(userFindResponseBody).not.toHaveProperty('email');
    });

    test('Retrieving user that does exists using different capital letters', async () => {
      const userCreatedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'userNameToBeFoundCAPS',
          email: 'userEmailToBeFoundCAPS@gmail.com',
          password: 'validpassword',
        }),
      });

      const userCreatedResponseBody = await userCreatedResponse.json();

      const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/usernametobefoundcaps`);
      const userFindResponseBody = await userFindResponse.json();

      expect(userFindResponse.status).toEqual(200);
      expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
      expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
      expect(userCreatedResponseBody.id).toEqual(userFindResponseBody.id);
      expect(userFindResponseBody.username).toEqual('userNameToBeFoundCAPS');
      expect(userFindResponseBody.features).toEqual(['read:activation_token', 'read:user', 'read:users']);
      expect(Date.parse(userFindResponseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(userFindResponseBody.updated_at)).not.toEqual(NaN);
      expect(userFindResponseBody).not.toHaveProperty('password');
      expect(userFindResponseBody).not.toHaveProperty('email');
    });
  });
});
