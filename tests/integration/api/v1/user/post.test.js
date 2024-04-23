import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/user', () => {
  describe('Anonymous user', () => {
    test('With invalid HTTP `method`', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'POST',
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(405);

      expect(responseBody).toStrictEqual({
        name: 'MethodNotAllowedError',
        message: 'Método "POST" não permitido para "/api/v1/user".',
        action: 'Utilize um método HTTP válido para este recurso.',
        status_code: 405,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });
});
