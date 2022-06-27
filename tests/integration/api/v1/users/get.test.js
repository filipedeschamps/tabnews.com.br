import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import user from 'models/user.js';
import password from 'models/password.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users', () => {
  describe('Anonymous user', () => {
    test('Retrieving blank user list', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('Retrieving user list with 2 users', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual([
        {
          id: firstUser.id,
          username: firstUser.username,
          features: firstUser.features,
          tabcoins: firstUser.tabcoins,
          tabcash: firstUser.tabcash,
          created_at: firstUser.created_at.toISOString(),
          updated_at: firstUser.updated_at.toISOString(),
        },
        {
          id: secondUser.id,
          username: secondUser.username,
          features: secondUser.features,
          tabcoins: secondUser.tabcoins,
          tabcash: secondUser.tabcash,
          created_at: secondUser.created_at.toISOString(),
          updated_at: secondUser.updated_at.toISOString(),
        },
      ]);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(Date.parse(responseBody[0].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].updated_at)).not.toEqual(NaN);
      expect(responseBody[0]).not.toHaveProperty('password');
      expect(responseBody[0]).not.toHaveProperty('email');

      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(Date.parse(responseBody[1].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].updated_at)).not.toEqual(NaN);
      expect(responseBody[1]).not.toHaveProperty('password');
      expect(responseBody[1]).not.toHaveProperty('email');
    });
  });
});
