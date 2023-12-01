import fetch from 'cross-fetch';
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

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'Não foi possível encontrar este recurso no sistema.',
        action: 'Verifique se o caminho (PATH) e o método (GET, POST, PUT, DELETE) estão corretos.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });
});
