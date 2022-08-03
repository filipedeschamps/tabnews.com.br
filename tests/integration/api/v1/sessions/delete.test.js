import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('DELETE /api/v1/sessions', () => {
  describe('Anonymous user', () => {
    test('With no "session_id" cookie', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'DELETE',
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:session".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With malformatted "session_id" cookie', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'DELETE',
        headers: {
          cookie: `session_id=tooshort`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"session_id" deve possuir 96 caracteres.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'session_id',
        type: 'string.length',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('Default user', () => {
    test('With valid session and necessary features', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      // First: test if the session is working
      const validSessionResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(validSessionResponse.status).toBe(200);
      const validSessionResponseBody = await validSessionResponse.json();
      expect(validSessionResponseBody.id).toBe(defaultUser.id);

      // Second: delete the session
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'DELETE',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        id: sessionObject.id,
        expires_at: responseBody.expires_at,
        created_at: sessionObject.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.created_at).toEqual(sessionObject.created_at.toISOString());
      expect(responseBody.expires_at < sessionObject.expires_at.toISOString()).toEqual(true);
      expect(responseBody.expires_at < sessionObject.created_at.toISOString()).toEqual(true);
      expect(responseBody.updated_at > sessionObject.updated_at.toISOString()).toEqual(true);

      // Third: test if the session is not working anymore
      const invalidSessionResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(invalidSessionResponse.status).toBe(401);
    });
  });

  describe('User without "read:session" feature', () => {
    test('With valid session, but without necessary feature', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);
      await orchestrator.removeFeaturesFromUser(defaultUser, ['read:session']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'DELETE',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Você não possui permissão para executar esta ação.',
        action: 'Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHENTICATION:INJECT_AUTHENTICATED_USER:USER_CANT_READ_SESSION',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });
});
