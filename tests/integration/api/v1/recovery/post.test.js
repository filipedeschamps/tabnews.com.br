import { version as uuidVersion } from 'uuid';

import recovery from 'models/recovery.js';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe('POST /api/v1/recovery', () => {
  describe('Anonymous user', () => {
    test('With "username" valid', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          username: 'userNotFound',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Você não possui permissão para criar um token de recuperação com username.',
        action: 'Verifique se este usuário tem a feature "create:recovery_token:username".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:RECOVERY:POST_HANDLER:CAN_NOT_CREATE_RECOVERY_TOKEN_USERNAME',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With "username" malformatted', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          username: 'valid@email.com',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"username" deve conter apenas caracteres alfanuméricos.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'username',
        type: 'string.alphanum',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With "email" valid and "user" found', async () => {
      const defaultUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email: defaultUser.email,
        }),
      });

      const responseBody = await response.json();

      const tokenInDatabase = await recovery.findOneTokenByUserId(defaultUser.id);

      expect.soft(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        used: false,
        expires_at: tokenInDatabase.expires_at.toISOString(),
        created_at: tokenInDatabase.created_at.toISOString(),
        updated_at: tokenInDatabase.updated_at.toISOString(),
      });

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.expires_at > responseBody.created_at).toBe(true);

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail.recipients[0].includes(defaultUser.email)).toBe(true);
      expect(lastEmail.subject).toBe('Recuperação de Senha');
      expect(lastEmail.text).toContain(defaultUser.username);
      expect(lastEmail.html).toContain(defaultUser.username);
      expect(lastEmail.text).toContain(recovery.getRecoverPageEndpoint(tokenInDatabase.id));
      expect(lastEmail.html).toContain(recovery.getRecoverPageEndpoint(tokenInDatabase.id));
    });

    test('With "email" valid, but user not found', async () => {
      await orchestrator.deleteAllEmails();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email: 'email@notfound.com',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(201);
      expect(responseBody).toStrictEqual({
        used: false,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.expires_at > responseBody.created_at).toBe(true);

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail).toBeNull();
    });

    test('With "email" malformatted', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email: 'validUsername',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"email" deve conter um email válido.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'email',
        type: 'string.email',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With key other than "username" or "email"', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          password: 'validpassword',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Objeto enviado deve ter no mínimo uma chave.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'object',
        type: 'object.min',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With blank Body', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"body" enviado deve ser do tipo Object.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'object',
        type: 'object.base',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With blank Object', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Objeto enviado deve ter no mínimo uma chave.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'object',
        type: 'object.min',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('User with "create:recovery_token:username" feature', () => {
    test('With "username" valid and "user" found', async () => {
      const defaultUser = await orchestrator.createUser();
      const userWithPermission = await orchestrator.createUser();
      await orchestrator.activateUser(userWithPermission);
      await orchestrator.addFeaturesToUser(userWithPermission, ['create:recovery_token:username']);
      const sessionObject = await orchestrator.createSession(userWithPermission);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },

        body: JSON.stringify({
          username: defaultUser.username,
        }),
      });

      const responseBody = await response.json();

      const tokenInDatabase = await recovery.findOneTokenByUserId(defaultUser.id);

      expect.soft(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        used: false,
        expires_at: tokenInDatabase.expires_at.toISOString(),
        created_at: tokenInDatabase.created_at.toISOString(),
        updated_at: tokenInDatabase.updated_at.toISOString(),
      });

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.expires_at > responseBody.created_at).toBe(true);

      const lastEmail = await orchestrator.getLastEmail();
      expect(lastEmail.recipients[0].includes(defaultUser.email)).toBe(true);
      expect(lastEmail.subject).toBe('Recuperação de Senha');
      expect(lastEmail.text).toContain(defaultUser.username);
      expect(lastEmail.html).toContain(defaultUser.username);
      expect(lastEmail.text).toContain(recovery.getRecoverPageEndpoint(tokenInDatabase.id));
      expect(lastEmail.html).toContain(recovery.getRecoverPageEndpoint(tokenInDatabase.id));
    });

    test('With "username" valid, but user not found', async () => {
      const userWithPermission = await orchestrator.createUser();
      await orchestrator.activateUser(userWithPermission);
      await orchestrator.addFeaturesToUser(userWithPermission, ['create:recovery_token:username']);
      const sessionObject = await orchestrator.createSession(userWithPermission);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          username: 'userNotFound',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O "username" informado não foi encontrado no sistema.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:RECOVERY:FIND_USER_BY_USERNAME_OR_EMAIL:NOT_FOUND',
        key: 'username',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });
});
