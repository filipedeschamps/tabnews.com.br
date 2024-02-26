import { version as uuidVersion } from 'uuid';

import user from 'models/user.js';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('POST /api/v1/users [FIREWALL]', () => {
  describe('Anonymous user', () => {
    test('Spamming valid users', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { response: response1, responseBody: response1Body } = await usersRequestBuilder.post({
        username: 'request1',
        email: 'request1@gmail.com',
        password: 'validpassword',
      });

      const activatedUser1 = await orchestrator.activateUser(response1Body);

      const { response: response2, responseBody: response2Body } = await usersRequestBuilder.post({
        username: 'request2',
        email: 'request2@gmail.com',
        password: 'validpassword',
      });

      const { response: response3, responseBody: response3Body } = await usersRequestBuilder.post({
        username: 'request3',
        email: 'request3@gmail.com',
        password: 'validpassword',
      });

      expect.soft(response1.status).toBe(201);
      expect.soft(response2.status).toBe(201);
      expect.soft(response3.status).toBe(429);

      expect(response3Body).toStrictEqual({
        name: 'TooManyRequestsError',
        message:
          'Identificamos a criação de muitos usuários em um curto período, então usuários criados recentemente podem ter sido desabilitados.',
        action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
        status_code: 429,
        error_id: response3Body.error_id,
        request_id: response3Body.request_id,
      });

      const user1 = await user.findOneById(response1Body.id);
      const user2 = await user.findOneById(response2Body.id);
      await expect(user.findOneByUsername('request3')).rejects.toThrow(
        'O "username" informado não foi encontrado no sistema.',
      );

      expect(user1.features).toStrictEqual([
        'create:content',
        'create:content:text_root',
        'create:content:text_child',
        'update:content',
        'update:user',
      ]);
      expect(user1.updated_at.toISOString()).toEqual(activatedUser1.updated_at.toISOString());
      expect(Date.parse(user1.updated_at)).not.toEqual(NaN);

      expect(user2.features).toStrictEqual([]);
      expect(user2.updated_at.toISOString()).toEqual(response2Body.updated_at);
      expect(Date.parse(user2.updated_at)).not.toEqual(NaN);

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
