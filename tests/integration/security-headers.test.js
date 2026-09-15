import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.runPendingMigrations();
});

describe('Security Headers', () => {
  test('With misleading "X-Powered-By" on API routes', async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/status`);

    expect.soft(response.status).toBe(200);
    expect(response.headers.get('x-powered-by')).toBe('PHP/8.3.0');
  });

  test('With misleading "X-Powered-By" on pages', async () => {
    const response = await fetch(`${orchestrator.webserverUrl}/`);

    expect.soft(response.status).toBe(200);
    expect(response.headers.get('x-powered-by')).toBe('PHP/8.3.0');
  });
});
