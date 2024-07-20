import { version as uuidVersion } from 'uuid';

import totp from 'models/totp';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/mfa/totp/disable', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const disableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/disable');
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);

      const { response, responseBody } = await disableRequestBuilder.patch({ username: user.username });

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
      const user = await enableRequestBuilder.buildUser();

      const disableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/disable');

      const totp_secret = totp.createSecret();
      await enableRequestBuilder.patch({ totp_secret });
      await disableRequestBuilder.setUser(user);

      const { response, responseBody } = await disableRequestBuilder.patch({ username: user.username });

      expect(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        message: 'O TOTP foi desativado com sucesso.',
      });
    });

    test('With valid session and necessary features but user already disable TOTP', async () => {
      const disableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/disable');
      const { username } = await disableRequestBuilder.buildUser();

      const { response, responseBody } = await disableRequestBuilder.patch({ username });

      expect(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O duplo fator de autenticação já está desativado para o usuário informado.',
        action: 'Verifique se você informou o usuário correto.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:MFA:TOTP:ENABLE:TOTP_ALREADY_DISABLED_TO_USER',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const disableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/disable');
      const { username } = await disableRequestBuilder.buildUser({ without: ['read:session'] });

      const { response, responseBody } = await disableRequestBuilder.patch({ username });

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

      const disableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/disable');
      const { username } = await disableRequestBuilder.buildUser({ without: ['read:session'] });
      const defaultUserSession = disableRequestBuilder.sessionObject;

      vi.useRealTimers();

      const { response, responseBody } = await disableRequestBuilder.patch({ username });

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

    test('With valid session and features to disable TOTP for other user', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/enable');
      const { username } = await enableRequestBuilder.buildUser();
      const totp_secret = totp.createSecret();

      await enableRequestBuilder.patch({ totp_secret });

      const disableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/disable');
      await disableRequestBuilder.buildUser({ with: ['update:user:others'] });

      const { response, responseBody } = await disableRequestBuilder.patch({ username });

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        message: 'O TOTP foi desativado com sucesso.',
      });
    });

    test('With valid session but without features to disable TOTP for other user', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/enable');
      const { username } = await enableRequestBuilder.buildUser();
      const totp_secret = totp.createSecret();

      await enableRequestBuilder.patch({ totp_secret });

      const disableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp/disable');
      await disableRequestBuilder.buildUser();

      const { response, responseBody } = await disableRequestBuilder.patch({ username });

      expect(response.status).toEqual(403);
      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Você não possui permissão para desabilitar TOTP de outro usuário.',
        action: 'Verifique se você recebeu a feature "update:user:others".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:MFA:TOTP:ENABLE:USER_NOT_ALLOWED_DISABLE_TOTP_TO_OTHER_USER',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });
});
