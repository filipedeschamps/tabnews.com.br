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

      expect(response.status).toEqual(503);
      expect(responseBody.message).toEqual('Funcionalidade em manutenção.');
      expect(responseBody.action).toEqual('Tente novamente mais tarde.');
      expect(responseBody.error_location_code).toEqual('INFRA:UNDER_MAINTENANCE:CHECK:IS_UNDER_MAINTENANCE');
    });

    test('Trying to access "method" under maintenance, but distinct "path"', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/inexistent-route`, {
        method: 'POST',
      });

      expect(response.status).toEqual(404);
      expect(response.statusText).toEqual('Not Found');
      expect(response.ok).toEqual(false);
    });

    test('Trying to access "path" under maintenance, but distinct "method"', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/under-maintenance-test`, {
        method: 'GET',
      });

      expect(response.status).toEqual(404);
      expect(response.statusText).toEqual('Not Found');
      expect(response.ok).toEqual(false);
    });
  });
});
