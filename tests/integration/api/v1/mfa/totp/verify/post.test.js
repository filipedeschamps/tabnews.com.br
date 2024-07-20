import { version as uuidVersion } from 'uuid';

import totp from 'models/totp';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/mfa/totp/verify', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/mfa/totp/verify');

      const otp = totp.createTOTP();
      const totp_token = otp.generate();
      const totp_secret = otp.secret.base32;

      const { response, responseBody } = await requestBuilder.post({ totp_token, totp_secret });

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
  });

  describe('Default user', () => {
    test('With valid session and necessary features sending a valid token and secret', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/mfa/totp/verify');
      await requestBuilder.buildUser();

      const otp = totp.createTOTP();
      const totp_token = otp.generate();
      const totp_secret = otp.secret.base32;

      const { response, responseBody } = await requestBuilder.post({ totp_token, totp_secret });

      expect(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        message: 'O código TOTP informado é válido',
        status_code: 200,
      });
    });

    test('With valid session and necessary features sending a invalid secret', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/mfa/totp/verify');
      await requestBuilder.buildUser();

      const otp = totp.createTOTP();
      const wrongSecret = totp.createSecret();

      const { response, responseBody } = await requestBuilder.post({
        totp_token: otp.generate(),
        totp_secret: wrongSecret,
      });

      expect(response.status).toBe(403);
      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'O código TOTP informado é inválido.',
        action: 'Verifique se o horário do seu aplicativo está sincronizado e tente novamente.',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:MFA:TOTP:VERIFY:USER_INVALID_TOTP_CODE',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With valid session and necessary features sending a invalid token', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/mfa/totp/verify');
      await requestBuilder.buildUser();

      const secret = totp.createSecret();
      const wrongSecret = totp.createSecret();
      const otp = totp.createTOTP(wrongSecret);

      const { response, responseBody } = await requestBuilder.post({
        totp_token: otp.generate(),
        totp_secret: secret,
      });

      expect(response.status).toBe(403);
      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'O código TOTP informado é inválido.',
        action: 'Verifique se o horário do seu aplicativo está sincronizado e tente novamente.',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:MFA:TOTP:VERIFY:USER_INVALID_TOTP_CODE',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/mfa/totp/verify');
      await requestBuilder.buildUser({ without: ['read:session'] });

      const otp = totp.createTOTP();

      const { response, responseBody } = await requestBuilder.post({
        totp_token: otp.generate(),
        totp_secret: otp.secret.base32,
      });

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

    test('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      });

      const requestBuilder = new RequestBuilder('/api/v1/mfa/totp/verify');
      await requestBuilder.buildUser();

      const defaultUserSession = requestBuilder.sessionObject;

      const otp = totp.createTOTP();
      const totp_token = otp.generate();
      const totp_secret = otp.secret.base32;

      vi.useRealTimers();

      const { response, responseBody } = await requestBuilder.post({ totp_token, totp_secret });

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
