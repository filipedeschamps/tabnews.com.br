import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';
import event from 'models/event.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/events [NOT YET IMPLEMENTED]', () => {
  describe('Anonymous user', () => {
    test('Returning all types of events', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'validusername',
          email: 'valid@email.com',
          password: 'validpassword',
        }),
      });

      const createUserResponseBody = await createUserResponse.json();

      await orchestrator.activateUser(createUserResponseBody);
      const sessionObject = await orchestrator.createSession(createUserResponseBody);

      const createContentRootResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Root',
          body: 'Root',
          status: 'published',
        }),
      });

      const createContentRootResponseBody = await createContentRootResponse.json();

      const createContentChildRootResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Child',
          body: 'Child',
          status: 'published',
          parent_id: createContentRootResponseBody.id,
        }),
      });

      const createContentChildResponseBody = await createContentChildRootResponse.json();

      const events = await event.findAll();

      expect(events.length).toEqual(3);

      expect(uuidVersion(events[0].id)).toEqual(4);
      expect(events[0].type).toEqual('create:user');
      expect(events[0].originator_user_id).toEqual(createUserResponseBody.id);
      expect(events[0].originator_ip).toEqual('127.0.0.1');
      expect(events[0].metadata).toEqual({
        id: createUserResponseBody.id,
      });
      expect(Date.parse(events[0].created_at)).not.toEqual(NaN);

      expect(uuidVersion(events[1].id)).toEqual(4);
      expect(events[1].type).toEqual('create:content:text_root');
      expect(events[1].originator_user_id).toEqual(createUserResponseBody.id);
      expect(events[1].originator_ip).toEqual('127.0.0.1');
      expect(events[1].metadata).toEqual({
        id: createContentRootResponseBody.id,
      });
      expect(Date.parse(events[1].created_at)).not.toEqual(NaN);

      expect(uuidVersion(events[2].id)).toEqual(4);
      expect(events[2].type).toEqual('create:content:text_child');
      expect(events[2].originator_user_id).toEqual(createUserResponseBody.id);
      expect(events[2].originator_ip).toEqual('127.0.0.1');
      expect(events[2].metadata).toEqual({
        id: createContentChildResponseBody.id,
      });
      expect(Date.parse(events[2].created_at)).not.toEqual(NaN);
    });
  });
});
