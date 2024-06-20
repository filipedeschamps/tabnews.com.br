import { version as uuidVersion } from 'uuid';

import user from 'models/user.js';
import orchestrator from 'tests/orchestrator.js';

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
        method: 'POST',
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
        method: 'POST',
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
        method: 'POST',
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

      expect.soft(request1.status).toBe(201);
      expect.soft(request2.status).toBe(201);
      expect.soft(request3.status).toBe(429);

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
      await expect(user.findOneByUsername('request3')).rejects.toThrow(
        'O "username" informado não foi encontrado no sistema.',
      );

      expect(user1.features).toStrictEqual([]);
      expect(user2.features).toStrictEqual([]);

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'firewall:block_users',
        originator_user_id: null,
        originator_ip: '127.0.0.1',
        metadata: {
          from_rule: 'create:user',
          users: [user1.id, user2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBe(NaN);
    });
  });
});
