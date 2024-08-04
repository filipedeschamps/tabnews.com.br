import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe('GET /api/v1/sessions', () => {
  describe('Anonymous user', () => {
    test('With invalid HTTP `method`', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'GET',
      });

      const responseBody = await response.json();

      expect(response.status).toBe(405);

      expect(responseBody).toStrictEqual({
        name: 'MethodNotAllowedError',
        message: 'Método "GET" não permitido para "/api/v1/sessions".',
        action: 'Utilize um método HTTP válido para este recurso.',
        status_code: 405,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });
});
