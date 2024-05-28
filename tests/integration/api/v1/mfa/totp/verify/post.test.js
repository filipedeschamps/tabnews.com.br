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

describe('POST /api/v1/mfa/totp/verify', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totp_token: '123',
          totp_secret: '123',
        }),
      });

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
  });

  describe('Default user', () => {
    test('With valid session and necessary features sending a valid token and secret', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const secret = totp.createSecret();
      const otp = totp.createTOTP(secret);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: otp.generate(),
          totp_secret: secret,
        }),
      });

      expect(response.status).toBe(204);
    });

    test('With valid session and necessary features sending a invalid secret', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const secret = totp.createSecret();
      const wrongSecret = totp.createSecret();
      const otp = totp.createTOTP(secret);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: otp.generate(),
          totp_secret: wrongSecret,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Código informado inválido.');
      expect(responseBody.action).toEqual(
        'Verifique se o horário do seu aplicativo está sincronizado e tente novamente.',
      );
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:MFA:TOTP:VERIFY:USER_INVALID_TOTP_CODE');
    });

    test('With valid session and necessary features sending a invalid token', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const secret = totp.createSecret();
      const wrongSecret = totp.createSecret();
      const otp = totp.createTOTP(wrongSecret);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: otp.generate(),
          totp_secret: secret,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Código informado inválido.');
      expect(responseBody.action).toEqual(
        'Verifique se o horário do seu aplicativo está sincronizado e tente novamente.',
      );
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:MFA:TOTP:VERIFY:USER_INVALID_TOTP_CODE');
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);
      await orchestrator.removeFeaturesFromUser(defaultUser, ['read:session']);

      const secret = totp.createSecret();
      const otp = totp.createTOTP(secret);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          totp_token: otp.generate(),
          totp_secret: secret,
        }),
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
    });

    test('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      });

      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      vi.useRealTimers();

      const secret = totp.createSecret();
      const otp = totp.createTOTP(secret);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: otp.generate(),
          totp_secret: secret,
        }),
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
