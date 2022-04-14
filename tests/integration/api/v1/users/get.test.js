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
      expect(responseBody.length).toEqual(2);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(responseBody[0].username).toEqual(firstUser.username);
      expect(responseBody[0].features).toEqual(firstUser.features);
      expect(Date.parse(responseBody[0].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].updated_at)).not.toEqual(NaN);
      expect(responseBody[0]).not.toHaveProperty('password');
      expect(responseBody[0]).not.toHaveProperty('email');

      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(responseBody[1].username).toEqual(secondUser.username);
      expect(responseBody[1].features).toEqual(secondUser.features);
      expect(Date.parse(responseBody[1].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].updated_at)).not.toEqual(NaN);
      expect(responseBody[1]).not.toHaveProperty('password');
      expect(responseBody[1]).not.toHaveProperty('email');
    });
  });
});
