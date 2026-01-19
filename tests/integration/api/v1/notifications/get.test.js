import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/notifications', () => {
  describe('Anonymous user', () => {
    test('403 - Retrieving notifications as anonymous user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications`, {
        method: 'GET',
        headers: {},
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');
      expect.soft(responseBody.message).toBe('Usuário não pode executar esta operação.');
    });
  });
  describe('Authenticated User', () => {
    test('200 - Retrieving notifications as authenticated user when is empty', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');

      expect.soft(Array.isArray(responseBody.rows)).toBe(true);
      expect.soft(responseBody.rows.length).toBe(0);
      expect.soft(responseBody.pagination.totalRows).toBe(0);
      expect.soft(responseBody.pagination.currentPage).toBe(1);
    });

    test('200 - Retrieving notifications as authenticated user only unread', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      await orchestrator.createNotification({ user_id: defaultUser.id, read: false });
      await orchestrator.createNotification({ user_id: defaultUser.id, read: true });
      await orchestrator.createNotification({ user_id: defaultUser.id, read: false });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');

      expect.soft(Array.isArray(responseBody.rows)).toBe(true);
      expect.soft(responseBody.rows.length).toBe(2);
      expect.soft(responseBody.pagination.currentPage).toBe(1);
      expect.soft(responseBody.pagination.totalRows).toBe(2);
    });

    test('200 - Retrieving notifications as authenticated user only read', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      await orchestrator.createNotification({ user_id: defaultUser.id, read: false });
      await orchestrator.createNotification({ user_id: defaultUser.id, read: true });
      await orchestrator.createNotification({ user_id: defaultUser.id, read: false });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/notifications?read=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect.soft(response.headers.get('Content-Type')).toContain('application/json');

      expect.soft(Array.isArray(responseBody.rows)).toBe(true);
      expect.soft(responseBody.rows.length).toBe(1);
      expect.soft(responseBody.pagination.currentPage).toBe(1);
      expect.soft(responseBody.pagination.totalRows).toBe(1);
    });
  });
});
