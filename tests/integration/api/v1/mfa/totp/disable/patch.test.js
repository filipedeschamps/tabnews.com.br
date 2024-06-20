import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import authentication from 'models/authentication';
import totp from 'models/totp';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/mfa/totp/disable', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const secret = totp.createSecret();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/enable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totp_secret: secret,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "update:user".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });
  });

  describe('Default user', () => {
    test('With valid session and necessary features', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const secret = totp.createSecret();

      await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/enable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_secret: secret,
        }),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/disable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          username: defaultUser.username,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.message).toBeDefined();
      expect(responseBody.message).toBe('O TOTP foi desativado com sucesso.');
    });

    test('With valid session and necessary features but user already disable TOTP', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/disable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          username: defaultUser.username,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.message).toBeDefined();
      expect(responseBody.message).toBe('O duplo fator de autenticação já está desativado para o usuário informado.');
      expect(responseBody.action).toBeDefined();
      expect(responseBody.action).toBe('Verifique se você informou o usuário correto.');
      expect(responseBody.error_location_code).toBeDefined();
      expect(responseBody.error_location_code).toBe('CONTROLLER:MFA:TOTP:ENABLE:TOTP_ALREADY_DISABLED_TO_USER');
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);
      await orchestrator.removeFeaturesFromUser(defaultUser, ['read:session']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/disable`, {
        method: 'PATCH',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para executar esta ação.');
      expect(responseBody.action).toEqual(
        'Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".',
      );
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual(
        'MODEL:AUTHENTICATION:INJECT_AUTHENTICATED_USER:USER_CANT_READ_SESSION',
      );

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });

    test('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      });

      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      vi.useRealTimers();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/disable`, {
        method: 'PATCH',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(401);
      expect(responseBody.status_code).toEqual(401);
      expect(responseBody.name).toEqual('UnauthorizedError');
      expect(responseBody.message).toEqual('Usuário não possui sessão ativa.');
      expect(responseBody.action).toEqual('Verifique se este usuário está logado.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet.session_id.name).toEqual('session_id');
      expect(parsedCookiesFromGet.session_id.value).toEqual('invalid');
      expect(parsedCookiesFromGet.session_id.maxAge).toEqual(-1);
      expect(parsedCookiesFromGet.session_id.path).toEqual('/');
      expect(parsedCookiesFromGet.session_id.httpOnly).toEqual(true);

      const sessionObject = await orchestrator.findSessionByToken(defaultUserSession.token);
      expect(sessionObject).toBeUndefined();
    });

    test('With valid session and features to disable TOTP for other user', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);

      let targetUser = await orchestrator.createUser();
      targetUser = await orchestrator.activateUser(targetUser);

      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const targetUserSession = await orchestrator.createSession(targetUser);

      defaultUser = await orchestrator.addFeaturesToUser(defaultUser, ['update:user:others']);

      const secret = totp.createSecret();

      await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/enable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${targetUserSession.token}`,
        },
        body: JSON.stringify({
          totp_secret: secret,
        }),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/disable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          username: targetUser.username,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.message).toBeDefined();
      expect(responseBody.message).toEqual('O TOTP foi desativado com sucesso.');
    });

    test('With valid session but without features to disable TOTP for other user', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);

      let targetUser = await orchestrator.createUser();
      targetUser = await orchestrator.activateUser(targetUser);

      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const targetUserSession = await orchestrator.createSession(targetUser);

      const secret = totp.createSecret();

      await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/enable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${targetUserSession.token}`,
        },
        body: JSON.stringify({
          totp_secret: secret,
        }),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/disable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          username: targetUser.username,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para desabilitar totp de outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você recebeu a feature "update:user:others".');
      expect(responseBody.error_location_code).toBe(
        'CONTROLLER:MFA:TOTP:ENABLE:USER_NOT_ALLOWED_DISABLE_TOTP_TO_OTHER_USER',
      );
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });
});
