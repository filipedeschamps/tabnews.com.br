import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import authentication from 'models/authentication';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/mfa/totp/qrcode', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/qrcode`);

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:session".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });

    describe('Default user', () => {
      test('With valid session and necessary features', async () => {
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/qrcode`, {
          method: 'GET',
          headers: {
            cookie: `session_id=${defaultUserSession.token}`,
          },
        });

        const responseBody = await response.json();
        const { qrcode_uri, secret } = responseBody;

        expect(response.status).toBe(200);
        expect(qrcode_uri).toBeDefined();
        expect(qrcode_uri).toBeTypeOf('string');
        expect(qrcode_uri).toContain('data:image/png;base64');
        expect(secret).toBeDefined();
        expect(secret).toBeTypeOf('string');
        expect(secret).toHaveLength(32);
      });

      test('With valid session, but user lost "read:session" feature', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);
        await orchestrator.removeFeaturesFromUser(defaultUser, ['read:session']);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/qrcode`, {
          method: 'GET',
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

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
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
    });
  });
});
