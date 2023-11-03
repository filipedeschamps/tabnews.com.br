import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/sessions/captcha', () => {
  describe('Anonymous User', () => {
    test('Request a captcha', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions/captcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody).toHaveProperty('image');
      expect(responseBody.image).toMatch(/^data:image\//);
      expect(typeof responseBody.image).toBe('string');
    });
  });
});
