import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('Under maintenance route', () => {
  describe('Anonymous user', () => {
    test('Trying to access "method" and "path" under maintenance', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/under-maintenance-test`, {
        method: 'POST',
      });
      const responseBody = await response.json();

      expect.soft(response.status).toBe(503);
      expect(responseBody.message).toBe('Funcionalidade em manutenção.');
      expect(responseBody.action).toBe('Tente novamente mais tarde.');
      expect(responseBody.error_location_code).toBe('INFRA:UNDER_MAINTENANCE:CHECK:IS_UNDER_MAINTENANCE');
    });

    test('Trying to access "method" under maintenance, but distinct "path"', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/inexistent-route`, {
        method: 'POST',
      });

      expect.soft(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(response.ok).toBe(false);
    });

    test('Trying to access "path" under maintenance, but distinct "method"', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/under-maintenance-test`, {
        method: 'GET',
      });

      expect.soft(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(response.ok).toBe(false);
    });
  });
});
