import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import content from 'models/content.js';
import event from 'models/event.js';
import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';

beforeEach(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
  await orchestrator.deleteAllEmails();
});

describe('POST /api/v1/contents [FIREWALL]', () => {
  async function createContent(token, body) {
    return fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${token}`,
      },
      body: JSON.stringify({
        title: body.title,
        body: 'Corpo',
        status: 'published',
        parent_id: body.parent_id,
      }),
    });
  }

  describe('Default user', () => {
    describe('Root content', () => {
      test('Spamming valid "root" contents', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const request1 = await createContent(sessionObject.token, { title: 'Título 1' });
        const request2 = await createContent(sessionObject.token, { title: 'Título 2' });
        const request3 = await createContent(sessionObject.token, { title: 'Título 3' });

        const request1Body = await request1.json();
        const request2Body = await request2.json();
        const request3Body = await request3.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);
        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitas publicações, então publicações criadas recentemente podem ter sido removidas.',
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

        expect(content1.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content1.updated_at)).not.toEqual(NaN);
        expect(content1.updated_at.toISOString()).not.toEqual(request1Body.updated_at);

        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.updated_at)).not.toEqual(NaN);
        expect(content2.updated_at.toISOString()).not.toEqual(request2Body.updated_at);

        expect(content3).toBeUndefined();

        const events = await event.findAll();
        expect(events.length).toEqual(3);

        const lastEvent = events.at(-1);
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_root');
        expect(lastEvent.originator_user_id).toEqual(defaultUser.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_root',
          contents: [content1.id, content2.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "root" contents with a content deleted', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const request1 = await createContent(sessionObject.token, { title: 'Título 1' });
        const request2 = await createContent(sessionObject.token, { title: 'Título 2' });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.updateContent(request2Body.id, {
          status: 'deleted',
        });

        const request3 = await createContent(sessionObject.token, { title: 'Título 3' });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitas publicações, então publicações criadas recentemente podem ter sido removidas.',
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

        expect(content1.status).toEqual('deleted');
        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content3).toBeUndefined();

        const events = await event.findAll();
        expect(events.length).toEqual(3);

        const lastEvent = events.at(-1);
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_root');
        expect(lastEvent.originator_user_id).toEqual(defaultUser.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_root',
          contents: [content1.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "root" contents with TabCoins earnings', async () => {
        let defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const request1 = await createContent(sessionObject.token, { title: 'Título 1' });
        const request2 = await createContent(sessionObject.token, { title: 'Título 2' });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.createRate(request1Body, 10);
        await orchestrator.updateContent(request1Body.id, {
          status: 'deleted',
        });

        await orchestrator.createRate(request2Body, -3);
        await orchestrator.createRate(request2Body, 5);

        const userAfterRates = await user.findOneById(defaultUser.id, {
          withBalance: true,
        });
        expect(userAfterRates.tabcoins).toEqual(2);

        const request3 = await createContent(sessionObject.token, { title: 'Título 3' });

        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitas publicações, então publicações criadas recentemente podem ter sido removidas.',
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

        expect(content1.status).toEqual('deleted');
        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content3).toBeUndefined();

        const events = await event.findAll();
        const lastEvent = events.at(-1);

        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_root');
        expect(lastEvent.originator_user_id).toEqual(defaultUser.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_root',
          contents: [content2.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const userAfterFirewallCatch = await user.findOneById(defaultUser.id, {
          withBalance: true,
        });
        expect(userAfterFirewallCatch.tabcoins).toEqual(0);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Different users spamming valid "root" contents with TabCoins earnings', async () => {
        let user1 = await orchestrator.createUser();
        let user2 = await orchestrator.createUser();

        await orchestrator.activateUser(user1);
        await orchestrator.activateUser(user2);

        const sessionObject1 = await orchestrator.createSession(user1);
        const sessionObject2 = await orchestrator.createSession(user2);

        const request1 = await createContent(sessionObject1.token, { title: 'Título 1' });
        const request2 = await createContent(sessionObject2.token, { title: 'Título 2' });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.createRate(request1Body, 4);
        await orchestrator.createRate(request2Body, 2);

        const user1AfterRates = await user.findOneById(user1.id, {
          withBalance: true,
        });
        expect(user1AfterRates.tabcoins).toEqual(4);

        const user2AfterRates = await user.findOneById(user2.id, {
          withBalance: true,
        });
        expect(user2AfterRates.tabcoins).toEqual(2);

        const request3 = await createContent(sessionObject2.token, { title: 'Título 3' });

        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitas publicações, então publicações criadas recentemente podem ter sido removidas.',
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

        expect(content1.status).toEqual('deleted');
        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content3).toBeUndefined();

        const events = await event.findAll();
        const lastEvent = events.at(-1);

        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_root');
        expect(lastEvent.originator_user_id).toEqual(user2.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_root',
          contents: [content1.id, content2.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const user1AfterFirewallCatch = await user.findOneById(user1.id, {
          withBalance: true,
        });
        expect(user1AfterFirewallCatch.tabcoins).toEqual(0);

        const user2AfterFirewallCatch = await user.findOneById(user2.id, {
          withBalance: true,
        });
        expect(user2AfterFirewallCatch.tabcoins).toEqual(0);

        const allEmails = await orchestrator.getEmails();
        const email = allEmails[0];

        expect(allEmails).toHaveLength(1);
        expect(email.recipients).toEqual([`<${user1.email}>`]);
        expect(email.subject).toEqual('Um conteúdo seu foi removido');
        expect(email.text).toContain(user1.username);
        expect(email.html).toContain(user1.username);

        const deletedContentText =
          'Identificamos que você está tentando criar muitas publicações, então a sua publicação "Título 1" foi removida.';
        expect(email.text).toContain(deletedContentText);
        expect(email.html).toContain(deletedContentText.replaceAll('"', '&quot;'));

        expect(email.text).toContain(`Identificador do evento: ${lastEvent.id}`);
        expect(email.html).toContain('Identificador do evento');
        expect(email.html).toContain(lastEvent.id);
      });
    });

    describe('Child content', () => {
      test('Spamming valid "child" contents', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const rootContent = await createContent(sessionObject.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContent(sessionObject.token, { parent_id: rootContentBody.id });
        const request2 = await createContent(sessionObject.token, { parent_id: rootContentBody.id });
        const request3 = await createContent(sessionObject.token, { parent_id: rootContentBody.id, title: 'Título 3' });

        const request1Body = await request1.json();
        const request2Body = await request2.json();
        const request3Body = await request3.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);
        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitos comentários, então comentários criados recentemente podem ter sido removidos.',
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

        expect(content1.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content1.updated_at)).not.toEqual(NaN);
        expect(content1.updated_at.toISOString()).not.toEqual(request1Body.updated_at);

        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.updated_at)).not.toEqual(NaN);
        expect(content2.updated_at.toISOString()).not.toEqual(request2Body.updated_at);

        expect(content3).toBeUndefined();

        const events = await event.findAll();
        expect(events.length).toEqual(4);

        const lastEvent = events.at(-1);
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_child');
        expect(lastEvent.originator_user_id).toEqual(defaultUser.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_child',
          contents: [content1.id, content2.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "child" contents with a content deleted', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const rootContent = await createContent(sessionObject.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContent(sessionObject.token, { parent_id: rootContentBody.id });
        const request2 = await createContent(sessionObject.token, { parent_id: rootContentBody.id });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.updateContent(request2Body.id, {
          status: 'deleted',
        });

        const request3 = await createContent(sessionObject.token, { parent_id: rootContentBody.id, title: 'Título 3' });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitos comentários, então comentários criados recentemente podem ter sido removidos.',
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

        expect(content1.status).toEqual('deleted');
        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content3).toBeUndefined();

        const events = await event.findAll();
        expect(events.length).toEqual(4);

        const lastEvent = events.at(-1);
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_child');
        expect(lastEvent.originator_user_id).toEqual(defaultUser.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_child',
          contents: [content1.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "child" contents with TabCoins earnings', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const rootContent = await createContent(sessionObject.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContent(sessionObject.token, { parent_id: rootContentBody.id });
        const request2 = await createContent(sessionObject.token, { parent_id: rootContentBody.id });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.createRate(request1Body, 2);
        await orchestrator.updateContent(request1Body.id, {
          status: 'deleted',
        });

        await orchestrator.createRate(request2Body, 10);
        await orchestrator.createRate(request2Body, -1);

        const userAfterRates = await user.findOneById(defaultUser.id, {
          withBalance: true,
        });
        expect(userAfterRates.tabcoins).toEqual(9);

        const request3 = await createContent(sessionObject.token, { parent_id: rootContentBody.id, title: 'Título 3' });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitos comentários, então comentários criados recentemente podem ter sido removidos.',
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

        expect(content1.status).toEqual('deleted');
        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content3).toBeUndefined();

        const events = await event.findAll();
        const lastEvent = events.at(-1);

        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_child');
        expect(lastEvent.originator_user_id).toEqual(defaultUser.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_child',
          contents: [content2.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const userAfterFirewallCatch = await user.findOneById(defaultUser.id, {
          withBalance: true,
        });
        expect(userAfterFirewallCatch.tabcoins).toEqual(0);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Different users spamming valid "child" contents with TabCoins earnings', async () => {
        const userRootContent = await orchestrator.createUser();
        const user1 = await orchestrator.createUser();
        const user2 = await orchestrator.createUser();
        const user3 = await orchestrator.createUser();

        await orchestrator.activateUser(userRootContent);
        await orchestrator.activateUser(user1);
        await orchestrator.activateUser(user2);
        await orchestrator.activateUser(user3);

        await user.update(userRootContent.username, {
          notifications: false,
        });

        const sessionObjectRootContent = await orchestrator.createSession(userRootContent);
        const sessionObject1 = await orchestrator.createSession(user1);
        const sessionObject2 = await orchestrator.createSession(user2);
        const sessionObject3 = await orchestrator.createSession(user3);

        const rootContent = await createContent(sessionObjectRootContent.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContent(sessionObject1.token, { parent_id: rootContentBody.id });
        const request2 = await createContent(sessionObject2.token, { parent_id: rootContentBody.id });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.createRate(request1Body, 2);
        await orchestrator.createRate(request2Body, 1);

        const user1AfterRates = await user.findOneById(user1.id, {
          withBalance: true,
        });
        expect(user1AfterRates.tabcoins).toEqual(2);

        const user2AfterRates = await user.findOneById(user2.id, {
          withBalance: true,
        });
        expect(user2AfterRates.tabcoins).toEqual(1);

        const request3 = await createContent(sessionObject3.token, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Você está tentando criar muitos comentários, então comentários criados recentemente podem ter sido removidos.',
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

        expect(content1.status).toEqual('deleted');
        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content1.deleted_at)).not.toEqual(NaN);
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content3).toBeUndefined();

        const events = await event.findAll();
        const lastEvent = events.at(-1);

        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(lastEvent.type).toEqual('firewall:block_contents:text_child');
        expect(lastEvent.originator_user_id).toEqual(user3.id);
        expect(lastEvent.originator_ip).toEqual('127.0.0.1');
        expect(lastEvent.metadata).toEqual({
          from_rule: 'create:content:text_child',
          contents: [content1.id, content2.id],
        });
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const user1AfterFirewallCatch = await user.findOneById(user1.id, {
          withBalance: true,
        });
        expect(user1AfterFirewallCatch.tabcoins).toEqual(0);

        const user2AfterFirewallCatch = await user.findOneById(user2.id, {
          withBalance: true,
        });
        expect(user2AfterFirewallCatch.tabcoins).toEqual(0);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(2);

        const user1Email = allEmails.find((email) => email.recipients.includes(`<${user1.email}>`));
        const user2Email = allEmails.find((email) => email.recipients.includes(`<${user2.email}>`));

        expect(user1Email.recipients).toEqual([`<${user1.email}>`]);
        expect(user2Email.recipients).toEqual([`<${user2.email}>`]);

        expect(user1Email.subject).toEqual('Um conteúdo seu foi removido');
        expect(user2Email.subject).toEqual('Um conteúdo seu foi removido');

        expect(user1Email.text).toContain(user1.username);
        expect(user1Email.html).toContain(user1.username);
        expect(user2Email.text).toContain(user2.username);
        expect(user2Email.html).toContain(user2.username);

        const user1DeletedContentText = `Identificamos que você está tentando criar muitos comentários, então o seu comentário de ID "${content1.id}" foi removido.`;
        expect(user1Email.text).toContain(user1DeletedContentText);
        expect(user1Email.html).toContain(user1DeletedContentText.replaceAll('"', '&quot;'));

        const user2DeletedContentText = `Identificamos que você está tentando criar muitos comentários, então o seu comentário de ID "${content2.id}" foi removido.`;
        expect(user2Email.text).toContain(user2DeletedContentText);
        expect(user2Email.html).toContain(user2DeletedContentText.replaceAll('"', '&quot;'));

        expect(user1Email.text).toContain(`Identificador do evento: ${lastEvent.id}`);
        expect(user1Email.html).toContain('Identificador do evento');
        expect(user1Email.html).toContain(lastEvent.id);
        expect(user2Email.text).toContain(`Identificador do evento: ${lastEvent.id}`);
        expect(user2Email.html).toContain('Identificador do evento');
        expect(user2Email.html).toContain(lastEvent.id);
      });
    });
  });
});
