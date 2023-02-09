import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import content from 'models/content.js';
import event from 'models/event.js';

beforeEach(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('POST /api/v1/contents [FIREWALL]', () => {
  describe('Default user', () => {
    test('Spamming valid "root" contents', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const request1 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título 1',
          body: 'Corpo',
          status: 'published',
        }),
      });

      const request2 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título 2',
          body: 'Corpo',
          status: 'published',
        }),
      });

      const request3 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título 3',
          body: 'Corpo',
          status: 'published',
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
        message: 'Você está tentando criar muitos conteúdos na raiz do site.',
        action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
        status_code: 429,
        error_id: request3Body.error_id,
        request_id: request3Body.request_id,
      });

      const content1 = await content.findOne({
        where: {
          id: request1Body.id,
        },
      });

      const content2 = await content.findOne({
        where: {
          id: request2Body.id,
        },
      });

      const content3 = await content.findOne({
        where: {
          slug: 'titulo-3',
        },
      });

      expect(content1.status).toStrictEqual('draft');
      expect(content2.status).toStrictEqual('draft');
      expect(content3).toStrictEqual(undefined);

      const events = await event.findAll();
      expect(events.length).toEqual(3);

      expect(uuidVersion(events[2].id)).toEqual(4);
      expect(events[2].type).toEqual('firewall:block_contents:text_root');
      expect(events[2].originator_user_id).toEqual(defaultUser.id);
      expect(events[2].originator_ip).toEqual('127.0.0.1');
      expect(events[2].metadata).toEqual({
        from_rule: 'create:content:text_root',
        contents: [content1.id, content2.id],
      });
      expect(Date.parse(events[2].created_at)).not.toEqual(NaN);
    });

    test('Spamming valid "child" contents', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Root Content',
          body: 'Corpo',
          status: 'published',
        }),
      });

      const rootContentBody = await rootContent.json();

      const request1 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título 1',
          body: 'Corpo',
          status: 'published',
          parent_id: rootContentBody.id,
        }),
      });

      const request2 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título 2',
          body: 'Corpo',
          status: 'published',
          parent_id: rootContentBody.id,
        }),
      });

      const request3 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título 3',
          body: 'Corpo',
          status: 'published',
          parent_id: rootContentBody.id,
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
        message: 'Você está tentando criar muitas respostas.',
        action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
        status_code: 429,
        error_id: request3Body.error_id,
        request_id: request3Body.request_id,
      });

      const content1 = await content.findOne({
        where: {
          id: request1Body.id,
        },
      });

      const content2 = await content.findOne({
        where: {
          id: request2Body.id,
        },
      });

      const content3 = await content.findOne({
        where: {
          slug: 'titulo-3',
        },
      });

      expect(content1.status).toStrictEqual('draft');
      expect(content2.status).toStrictEqual('draft');
      expect(content3).toStrictEqual(undefined);

      const events = await event.findAll();
      expect(events.length).toEqual(4);

      expect(uuidVersion(events[3].id)).toEqual(4);
      expect(events[3].type).toEqual('firewall:block_contents:text_child');
      expect(events[3].originator_user_id).toEqual(defaultUser.id);
      expect(events[3].originator_ip).toEqual('127.0.0.1');
      expect(events[3].metadata).toEqual({
        from_rule: 'create:content:text_child',
        contents: [content1.id, content2.id],
      });
      expect(Date.parse(events[3].created_at)).not.toEqual(NaN);
    });
  });
});
