import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users/[username]/activity', () => {
  describe('Anonymous user', () => {
    test('Retrieving non-existing user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist/activity`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.error_location_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving nuked user', async () => {
      const userCreated = await orchestrator.createUser({ username: 'nukedUser' });

      await orchestrator.addFeaturesToUser(userCreated, ['nuked']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/nukedUser/activity`);

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.error_location_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving user with no activity', async () => {
      const userCreated = await orchestrator.createUser({ username: 'userWithNoActivity' });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userWithNoActivity/activity`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual({
        id: userCreated.id,
        activity: [],
      });
    });

    test('Retrieving user with activity', async () => {
      const userCreated = await orchestrator.createUser({ username: 'userWithActivity' });

      await orchestrator.createContent({
        owner_id: userCreated.id,
        title: 'contentCreated',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userWithActivity/activity`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual({
        id: userCreated.id,
        activity: [
          {
            count: 1,
            date: new Date().toISOString().split('T')[0],
          },
        ],
      });
    });
  });
});
