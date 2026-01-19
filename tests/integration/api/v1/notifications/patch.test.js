import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/notifications', () => {
  describe('Anonymous User', () => {
    it('403 - Marking notification as read as anonymous user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications`, {
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
    it('200 - Marking all notifications as read', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      await orchestrator.createNotification({ user_id: defaultUser.id, read: false });
      await orchestrator.createNotification({ user_id: defaultUser.id, read: false });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications`, {
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

      const unreadNotifications = await orchestrator.findAllNotification({
        where: { user_id: defaultUser.id, read: false },
        page: 1,
        per_page: 10,
      });
      expect.soft(unreadNotifications.rows.length).toBe(0);
    });
  });
});
