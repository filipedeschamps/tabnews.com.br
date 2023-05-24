import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import user from 'models/user.js';
import event from 'models/event.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('POST /api/v1/users [FIREWALL]', () => {
  describe('Anonymous user', () => {
    test('Spamming valid users', async () => {
      const request1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'request1',
          email: 'request1@gmail.com',
          password: 'validpassword',
        }),
      });

      const request2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'request2',
          email: 'request2@gmail.com',
          password: 'validpassword',
        }),
      });

      const request3 = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'request3',
          email: 'request3@gmail.com',
          password: 'validpassword',
        }),
      });

      const request1Body = await request1.json();
      const request2Body = await request2.json();
      const request3Body = await request3.json();

      expect(request1.status).toBe(201);
      expect(request2.status).toBe(201);
      expect(request3.status).toBe(429);

      expect(request3Body).toStrictEqual({
        name: 'TooManyRequestsError',
        message: 'Você está tentando criar muitos usuários.',
        action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
        status_code: 429,
        error_id: request3Body.error_id,
        request_id: request3Body.request_id,
      });

      const user1 = await user.findOneById(request1Body.id);
      const user2 = await user.findOneById(request2Body.id);
      await expect(user.findOneByUsername('request3')).rejects.toThrowError();

      expect(user1.features).toStrictEqual([]);
      expect(user2.features).toStrictEqual([]);

      const events = await event.findAll();
      expect(events.length).toEqual(3);

      expect(uuidVersion(events[2].id)).toEqual(4);
      expect(events[2].type).toEqual('firewall:block_users');
      expect(events[2].originator_user_id).toEqual(null);
      expect(events[2].originator_ip).toEqual('127.0.0.1');
      expect(events[2].metadata).toEqual({
        from_rule: 'create:user',
        users: [user1.id, user2.id],
      });
      expect(Date.parse(events[2].created_at)).not.toEqual(NaN);
    });
  });
});
