import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import event from 'models/event.js';
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

      const request1Body = await request1.json();

      await orchestrator.activateUser(request1Body);

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

      await orchestrator.deleteAllEmails();

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

      const request2Body = await request2.json();
      const request3Body = await request3.json();

      expect(request1.status).toBe(201);
      expect(request2.status).toBe(201);
      expect(request3.status).toBe(429);

      expect(request3Body).toStrictEqual({
        name: 'TooManyRequestsError',
        message:
          'Você está tentando criar muitos usuários, então usuários criados recentemente podem ter sido desabilitados.',
        action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
        status_code: 429,
        error_id: request3Body.error_id,
        request_id: request3Body.request_id,
      });

      const user1 = await user.findOneById(request1Body.id);
      const user2 = await user.findOneById(request2Body.id);
      await expect(user.findOneByUsername('request3')).rejects.toThrow();

      expect(user1.features).toStrictEqual([
        'create:content',
        'create:content:text_root',
        'create:content:text_child',
        'update:content',
        'update:user',
      ]);
      expect(user1.updated_at).not.toEqual(request1Body.updated_at);
      expect(user1.updated_at.toISOString()).not.toEqual(request1Body.updated_at);
      expect(Date.parse(user1.updated_at)).not.toEqual(NaN);

      expect(user2.features).toStrictEqual([]);
      expect(user2.updated_at.toISOString()).not.toEqual(request2Body.updated_at);
      expect(Date.parse(user2.updated_at)).not.toEqual(NaN);

      const events = await event.findAll();
      expect(events.length).toEqual(3);

      const lastEvent = events.at(-1);
      expect(uuidVersion(lastEvent.id)).toEqual(4);
      expect(lastEvent.type).toEqual('firewall:block_users');
      expect(lastEvent.originator_user_id).toBeNull();
      expect(lastEvent.originator_ip).toEqual('127.0.0.1');
      expect(lastEvent.metadata).toEqual({
        from_rule: 'create:user',
        users: [user1.id, user2.id],
      });
      expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

      const allEmails = await orchestrator.getEmails();
      expect(allEmails).toHaveLength(2);

      const user1Email = allEmails.find((email) => email.recipients.includes(`<${user1.email}>`));
      const user2Email = allEmails.find((email) => email.recipients.includes(`<${user2.email}>`));

      expect(user1Email.recipients).toEqual([`<${user1.email}>`]);
      expect(user2Email.recipients).toEqual([`<${user2.email}>`]);

      expect(user1Email.subject).toEqual('Sua conta foi desabilitada');
      expect(user2Email.subject).toEqual('Sua conta foi desabilitada');

      expect(user1Email.text).toContain(user1.username);
      expect(user1Email.html).toContain(user1.username);
      expect(user2Email.text).toContain(user2.username);
      expect(user2Email.html).toContain(user2.username);

      const userDeletedContentText = `Identificamos que você está tentando criar muitas contas, então a sua conta foi desabilitada.`;
      expect(user1Email.text).toContain(userDeletedContentText);
      expect(user1Email.html).toContain(userDeletedContentText);
      expect(user2Email.text).toContain(userDeletedContentText);
      expect(user2Email.html).toContain(userDeletedContentText);

      expect(user1Email.text).toContain(`Identificador do evento: ${lastEvent.id}`);
      expect(user1Email.html).toContain('Identificador do evento');
      expect(user1Email.html).toContain(lastEvent.id);
      expect(user2Email.text).toContain(`Identificador do evento: ${lastEvent.id}`);
      expect(user2Email.html).toContain('Identificador do evento');
      expect(user2Email.html).toContain(lastEvent.id);
    });
  });
});
