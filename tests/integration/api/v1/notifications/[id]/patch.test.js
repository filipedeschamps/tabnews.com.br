import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/notifications/[id]', () => {
  describe('Anonymous User', () => {
    it('403 - Marking notification as read as anonymous user', async () => {
      const mockId = crypto.randomUUID();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications/${mockId}`, {
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
      const notification = await orchestrator.createNotification({ user_id: defaultUser.id, read: false });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          read: true,
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');
      expect.soft(responseBody.success).toBe(true);

      const updatedNotifications = await orchestrator.findAllNotification({
        where: { id: notification.id },
        page: 1,
        per_page: 1,
      });
      expect.soft(updatedNotifications.rows[0].read).toBe(true);
    });
    it('200 - Marking notification as not read', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const notification = await orchestrator.createNotification({ user_id: defaultUser.id, read: true });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          read: false,
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');
      expect.soft(responseBody.success).toBe(true);

      const updatedNotifications = await orchestrator.findAllNotification({
        where: { id: notification.id },
        page: 1,
        per_page: 1,
      });
      expect.soft(updatedNotifications.rows[0].read).toBe(false);
    });
    it('400 - Marking notification as read with invalid body', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const notification = await orchestrator.createNotification({ user_id: defaultUser.id, read: false });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');
      expect.soft(responseBody.message).toBe('"read" é um campo obrigatório.');

      const notUpdatedNotifications = await orchestrator.findAllNotification({
        where: { id: notification.id },
        page: 1,
        per_page: 1,
      });
      expect.soft(notUpdatedNotifications.rows[0].read).toBe(false);
    });
    it('400 - Marking notification as read with invalid id', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications/1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');
      expect.soft(responseBody.message).toBe('"id" deve possuir um token UUID na versão 4.');
    });
  });
});
