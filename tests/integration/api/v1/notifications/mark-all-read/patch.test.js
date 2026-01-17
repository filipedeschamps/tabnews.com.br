import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/notifications/mark-all-read', () => {
  describe('Anonymous User', () => {
    it('403 - Marking notification as read as anonymous user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {},
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');
      expect.soft(responseBody.message).toBe('Usuário não pode executar esta operação.');
    });
  });
  describe('Authenticated User', () => {
    it('200 - Marking notification as read', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');
      expect.soft(responseBody.success).toBe(true);
    });
  });
});
