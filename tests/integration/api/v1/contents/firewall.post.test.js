import { version as uuidVersion } from 'uuid';

import content from 'models/content';
import user from 'models/user';
import orchestrator from 'tests/orchestrator';

beforeEach(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('POST /api/v1/contents [FIREWALL]', () => {
  async function createContentViaApi(token, body) {
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

        const request1 = await createContentViaApi(sessionObject.token, { title: 'Título 1' });
        const request2 = await createContentViaApi(sessionObject.token, { title: 'Título 2' });
        const request3 = await createContentViaApi(sessionObject.token, { title: 'Título 3' });

        const request1Body = await request1.json();
        const request2Body = await request2.json();
        const request3Body = await request3.json();

        expect.soft(request1.status).toBe(201);
        expect.soft(request2.status).toBe(201);
        expect.soft(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
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
        expect(content1.updated_at.toISOString()).toEqual(request1Body.updated_at);

        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content2.updated_at.toISOString()).toEqual(request2Body.updated_at);

        expect(content3).toBeUndefined();

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
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);
      });

      test('Spamming valid "root" contents with a content deleted', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const request1 = await createContentViaApi(sessionObject.token, { title: 'Título 1' });
        const request2 = await createContentViaApi(sessionObject.token, { title: 'Título 2' });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.updateContent(request2Body.id, {
          status: 'deleted',
        });

        const request3 = await createContentViaApi(sessionObject.token, { title: 'Título 3' });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
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

        const lastEvent = await orchestrator.getLastEvent();

        expect(lastEvent).toStrictEqual({
          id: lastEvent.id,
          type: 'firewall:block_contents:text_root',
          originator_user_id: defaultUser.id,
          originator_ip: '127.0.0.1',
          metadata: {
            from_rule: 'create:content:text_root',
            contents: [content1.id],
          },
          created_at: lastEvent.created_at,
        });
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);
      });

      test('Spamming valid "root" contents with TabCoins earnings', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const request1 = await createContentViaApi(sessionObject.token, { title: 'Título 1' });
        const request2 = await createContentViaApi(sessionObject.token, { title: 'Título 2' });

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

        const request3 = await createContentViaApi(sessionObject.token, { title: 'Título 3' });

        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
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

        const lastEvent = await orchestrator.getLastEvent();

        expect(lastEvent).toStrictEqual({
          id: lastEvent.id,
          type: 'firewall:block_contents:text_root',
          originator_user_id: defaultUser.id,
          originator_ip: '127.0.0.1',
          metadata: {
            from_rule: 'create:content:text_root',
            contents: [content2.id],
          },
          created_at: lastEvent.created_at,
        });
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const userAfterFirewallCatch = await user.findOneById(defaultUser.id, {
          withBalance: true,
        });
        expect(userAfterFirewallCatch.tabcoins).toEqual(0);
      });

      test('Different users spamming valid "root" contents with TabCoins earnings', async () => {
        const user1 = await orchestrator.createUser();
        const user2 = await orchestrator.createUser();

        await orchestrator.activateUser(user1);
        await orchestrator.activateUser(user2);

        const sessionObject1 = await orchestrator.createSession(user1);
        const sessionObject2 = await orchestrator.createSession(user2);

        const request1 = await createContentViaApi(sessionObject1.token, { title: 'Título 1' });
        const request2 = await createContentViaApi(sessionObject2.token, { title: 'Título 2' });

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

        const request3 = await createContentViaApi(sessionObject2.token, { title: 'Título 3' });

        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
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

        const lastEvent = await orchestrator.getLastEvent();

        expect(lastEvent).toStrictEqual({
          id: lastEvent.id,
          type: 'firewall:block_contents:text_root',
          originator_user_id: user2.id,
          originator_ip: '127.0.0.1',
          metadata: {
            from_rule: 'create:content:text_root',
            contents: [content1.id, content2.id],
          },
          created_at: lastEvent.created_at,
        });
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const user1AfterFirewallCatch = await user.findOneById(user1.id, {
          withBalance: true,
        });
        expect(user1AfterFirewallCatch.tabcoins).toEqual(0);

        const user2AfterFirewallCatch = await user.findOneById(user2.id, {
          withBalance: true,
        });
        expect(user2AfterFirewallCatch.tabcoins).toEqual(0);
      });
    });

    describe('Child content', () => {
      test('Spamming valid "child" contents', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const rootContent = await createContentViaApi(sessionObject.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContentViaApi(sessionObject.token, { parent_id: rootContentBody.id });
        const request2 = await createContentViaApi(sessionObject.token, { parent_id: rootContentBody.id });
        const request3 = await createContentViaApi(sessionObject.token, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });

        const request1Body = await request1.json();
        const request2Body = await request2.json();
        const request3Body = await request3.json();

        expect.soft(request1.status).toBe(201);
        expect.soft(request2.status).toBe(201);
        expect.soft(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
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
        expect(content1.updated_at.toISOString()).toEqual(request1Body.updated_at);

        expect(content2.status).toEqual('deleted');
        expect(Date.parse(content2.deleted_at)).not.toEqual(NaN);
        expect(content2.updated_at.toISOString()).toEqual(request2Body.updated_at);

        expect(content3).toBeUndefined();

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
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);
      });

      test('Spamming valid "child" contents with a content deleted', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const rootContent = await createContentViaApi(sessionObject.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContentViaApi(sessionObject.token, { parent_id: rootContentBody.id });
        const request2 = await createContentViaApi(sessionObject.token, { parent_id: rootContentBody.id });

        const request1Body = await request1.json();
        const request2Body = await request2.json();

        expect(request1.status).toBe(201);
        expect(request2.status).toBe(201);

        await orchestrator.updateContent(request2Body.id, {
          status: 'deleted',
        });

        const request3 = await createContentViaApi(sessionObject.token, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
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

        const lastEvent = await orchestrator.getLastEvent();

        expect(lastEvent).toStrictEqual({
          id: lastEvent.id,
          type: 'firewall:block_contents:text_child',
          originator_user_id: defaultUser.id,
          originator_ip: '127.0.0.1',
          metadata: {
            from_rule: 'create:content:text_child',
            contents: [content1.id],
          },
          created_at: lastEvent.created_at,
        });
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);
      });

      test('Spamming valid "child" contents with TabCoins earnings', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const rootContent = await createContentViaApi(sessionObject.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContentViaApi(sessionObject.token, { parent_id: rootContentBody.id });
        const request2 = await createContentViaApi(sessionObject.token, { parent_id: rootContentBody.id });

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

        const request3 = await createContentViaApi(sessionObject.token, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
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

        const lastEvent = await orchestrator.getLastEvent();

        expect(lastEvent).toStrictEqual({
          id: lastEvent.id,
          type: 'firewall:block_contents:text_child',
          originator_user_id: defaultUser.id,
          originator_ip: '127.0.0.1',
          metadata: {
            from_rule: 'create:content:text_child',
            contents: [content2.id],
          },
          created_at: lastEvent.created_at,
        });
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const userAfterFirewallCatch = await user.findOneById(defaultUser.id, {
          withBalance: true,
        });
        expect(userAfterFirewallCatch.tabcoins).toEqual(0);
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

        const rootContent = await createContentViaApi(sessionObjectRootContent.token, { title: 'Root Content' });
        const rootContentBody = await rootContent.json();

        const request1 = await createContentViaApi(sessionObject1.token, { parent_id: rootContentBody.id });
        const request2 = await createContentViaApi(sessionObject2.token, { parent_id: rootContentBody.id });

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

        const request3 = await createContentViaApi(sessionObject3.token, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });
        const request3Body = await request3.json();

        expect(request3.status).toBe(429);

        expect(request3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
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

        const lastEvent = await orchestrator.getLastEvent();

        expect(lastEvent).toStrictEqual({
          id: lastEvent.id,
          type: 'firewall:block_contents:text_child',
          originator_user_id: user3.id,
          originator_ip: '127.0.0.1',
          metadata: {
            from_rule: 'create:content:text_child',
            contents: [content1.id, content2.id],
          },
          created_at: lastEvent.created_at,
        });
        expect(uuidVersion(lastEvent.id)).toEqual(4);
        expect(Date.parse(lastEvent.created_at)).not.toEqual(NaN);

        const user1AfterFirewallCatch = await user.findOneById(user1.id, {
          withBalance: true,
        });
        expect(user1AfterFirewallCatch.tabcoins).toEqual(0);

        const user2AfterFirewallCatch = await user.findOneById(user2.id, {
          withBalance: true,
        });
        expect(user2AfterFirewallCatch.tabcoins).toEqual(0);
      });
    });
  });
});
