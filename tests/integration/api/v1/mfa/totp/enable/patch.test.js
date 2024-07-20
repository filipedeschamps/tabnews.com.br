import { version as uuidVersion } from 'uuid';

import totp from 'models/totp';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/mfa/totp/enable', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/enable');

      const totp_secret = totp.createSecret();

      const { response, responseBody } = await enableRequestBuilder.patch({ totp_secret });

      expect(response.status).toEqual(403);
      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "update:user".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });
  });

  describe('Default user', () => {
    test('With valid session and necessary features', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/enable');
      await enableRequestBuilder.buildUser();

      const totp_secret = totp.createSecret();

      const { response, responseBody } = await enableRequestBuilder.patch({ totp_secret });

      expect(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        message: 'O duplo fator de autenticação foi configurado com sucesso.',
      });
    });

    test('With valid session and necessary features but user already enable TOTP', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/enable');
      await enableRequestBuilder.buildUser();

      const totp_secret = totp.createSecret();

      await enableRequestBuilder.patch({ totp_secret });

      const { response, responseBody } = await enableRequestBuilder.patch({ totp_secret });

      expect(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Duplo fator de autenticação já habilitado para a conta.',
        action: 'Verifique se você está realizando a operação correta.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:MFA:TOTP:ENABLE:TOTP_ALREADY_CONFIGURED',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/enable');
      await enableRequestBuilder.buildUser({ without: ['read:session'] });

      const totp_secret = totp.createSecret();

      await enableRequestBuilder.patch({ totp_secret });

      const { response, responseBody } = await enableRequestBuilder.patch({ totp_secret });

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

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });

    test('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      });

      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/enable');
      const totp_secret = totp.createSecret();

      await enableRequestBuilder.buildUser();
      const defaultUserSession = enableRequestBuilder.sessionObject;

      vi.useRealTimers();

      const { response, responseBody } = await enableRequestBuilder.patch({ totp_secret });

      expect(response.status).toEqual(401);
      expect(responseBody).toStrictEqual({
        name: 'UnauthorizedError',
        message: 'Usuário não possui sessão ativa.',
        action: 'Verifique se este usuário está logado.',
        status_code: 401,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
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
