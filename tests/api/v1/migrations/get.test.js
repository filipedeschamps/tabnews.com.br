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
    test('Should return a ForbiddenError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`);

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "migration:read".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User with migration:read feature', () => {
    let firstUser;
    let firstUserSession;

    beforeEach(async () => {
      firstUser = await orchestrator.createUser();
      firstUser = await orchestrator.activateUser(firstUser);
      firstUser = await orchestrator.addFeaturesToUser(firstUser, ['migration:read']);
      firstUserSession = await orchestrator.createSession(firstUser);
    });

    test('Should list all migrations', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(Array.isArray(responseBody)).toEqual(true);
    });
  });

  describe('User without migration:read feature', () => {
    let secondUser;
    let secondUserSession;

    beforeEach(async () => {
      secondUser = await orchestrator.createUser();
      secondUser = await orchestrator.activateUser(secondUser);
      secondUserSession = await orchestrator.createSession(secondUser);
    });

    test('Should return a ForbiddenError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${secondUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "migration:read".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User losing migration:read feature', () => {
    let thirdUser;
    let thirdUserSession;

    beforeEach(async () => {
      thirdUser = await orchestrator.createUser();
      thirdUser = await orchestrator.activateUser(thirdUser);
      thirdUser = await orchestrator.addFeaturesToUser(thirdUser, ['migration:read']);
      thirdUserSession = await orchestrator.createSession(thirdUser);
    });

    test('Should return a ForbiddenError after remove migration:read feature', async () => {
      const responseBefore = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${thirdUserSession.token}`,
        },
      });

      expect(responseBefore.status).toEqual(200);

      thirdUser = await orchestrator.removeFeaturesFromUser(thirdUser, ['migration:read']);

      const responseAfter = await fetch(`${orchestrator.webserverUrl}/api/v1/migrations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${thirdUserSession.token}`,
        },
      });

      const responseBody = await responseAfter.json();

      expect(responseAfter.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "migration:read".');
      expect(responseBody.statusCode).toEqual(403);
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
      expect(responseBody.errorUniqueCode).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });
});
