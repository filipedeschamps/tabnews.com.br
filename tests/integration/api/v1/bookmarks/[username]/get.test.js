import fetch from 'cross-fetch';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/bookmarks/[username]', () => {
  beforeEach(async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  describe('Anonymous user', () => {
    test('with no session', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/bookmarks/${defaultUser.username}`, {
        method: 'GET',
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.bookmarks).toEqual([]);
    });
  });

  describe('With authenticated user', () => {
    test('With a session and 0 bookmarks', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/bookmarks/${defaultUser.username}`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.bookmarks).toEqual([]);
    });

    test('With a session and 2 bookmarks', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado',
        status: 'published',
      });

      const secondRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo criado',
        status: 'published',
      });

      await orchestrator.addBookmarksToUser(defaultUser.id, [firstRootContent.id, secondRootContent.id]);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/bookmarks/${defaultUser.username}`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.bookmarks).toEqual([firstRootContent.id, secondRootContent.id]);
    });
  });
});
