import { version as uuidVersion } from 'uuid';

import content from 'models/content.js';
import orchestrator from 'tests/orchestrator.js';

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
        method: 'POST',
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
        method: 'POST',
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
        method: 'POST',
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

      expect.soft(request1.status).toBe(201);
      expect.soft(request2.status).toBe(201);
      expect.soft(request3.status).toBe(429);

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

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'firewall:block_contents:text_root',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          from_rule: 'create:content:text_root',
          contents: [content1.id, content2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBe(NaN);
    });

    test('Spamming valid "child" contents', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
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
        method: 'POST',
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
        method: 'POST',
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
        method: 'POST',
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

      expect.soft(request1.status).toBe(201);
      expect.soft(request2.status).toBe(201);
      expect.soft(request3.status).toBe(429);

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

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'firewall:block_contents:text_child',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          from_rule: 'create:content:text_child',
          contents: [content1.id, content2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBe(NaN);
    });
  });
});
