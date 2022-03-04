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

describe('PATCH /api/v1/users/[username]', () => {
  //TODO: test with expired session

  describe('Anonymous user', () => {
    test('Patching other user', async () => {
      let secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          username: 'regularUserPatchingOtherUser',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "update:user".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with default features', () => {
    let firstUser;
    let firstUserSession;

    beforeEach(async () => {
      firstUser = await orchestrator.createUser();
      firstUser = await orchestrator.activateUser(firstUser);
      firstUserSession = await orchestrator.createSession(firstUser);
    });

    test('Patching other user', async () => {
      let secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'regularUserPatchingOtherUser',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para atualizar outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "update:user:others_email".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('CONTROLLER:USERS:USERNAME:PATCH:USER_CANT_UPDATE_OTHER_USER');
    });

    test('Patching itself with a valid and unique username', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'regularUserPatchingHisUsername',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(firstUser.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('regularUserPatchingHisUsername');
      expect(responseBody.features).toEqual(firstUser.features);
      expect(responseBody.email).toEqual(firstUser.email);
      expect(responseBody.created_at).toEqual(firstUser.created_at.toISOString());
      expect(responseBody.updated_at > firstUser.created_at.toISOString()).toBe(true);
      expect(responseBody).not.toHaveProperty('password');

      const firstUserInDatabase = await user.findOneById(responseBody.id);
      const passwordsMatch = await password.compare('password', firstUserInDatabase.password);
      expect(passwordsMatch).toBe(true);
    });
  });

  describe('User with "update:user:others_email" feature', () => {
    let firstUser;
    let firstUserSession;
    let secondUser;

    beforeEach(async () => {
      firstUser = await orchestrator.createUser();
      firstUser = await orchestrator.activateUser(firstUser);
      firstUser = await orchestrator.addFeaturesToUser(firstUser, ['update:user:others_email']);
      firstUserSession = await orchestrator.createSession(firstUser);
      secondUser = await orchestrator.createUser();
    });

    test('Patching other user username', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'updateOthersPatchingOtherUser',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(firstUser.id).not.toEqual(responseBody.id);
      expect(secondUser.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('updateOthersPatchingOtherUser');
      expect(responseBody.features).toEqual(secondUser.features);
      expect(responseBody.created_at).toEqual(secondUser.created_at.toISOString());
      expect(responseBody.updated_at > secondUser.created_at.toISOString()).toBe(true);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('email');

      const secondUserInDatabase = await user.findOneById(responseBody.id);
      const passwordsMatch = await password.compare('password', secondUserInDatabase.password);
      expect(passwordsMatch).toBe(true);
    });
  });
});
