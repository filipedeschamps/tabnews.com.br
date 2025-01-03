import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/mfa/totp/enable', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp');

      const { response, responseBody } = await enableRequestBuilder.get();

      expect(response.status).toBe(403);
      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:session".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });
  });

  describe('Default user', () => {
    test('With valid session and necessary features', async () => {
      const enableRequestBuilder = new RequestBuilder('/api/v1/mfa/totp');
      const { username } = await enableRequestBuilder.buildUser();

      const { response, responseBody } = await enableRequestBuilder.get();

      const secret = responseBody.totp.split('&')[1];

      expect(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        totp: `otpauth://totp/TabNews:${username}?issuer=TabNews&${secret}&algorithm=SHA1&digits=6&period=30`,
      });
      expect(secret).toHaveLength(39);
    });
  });
});
