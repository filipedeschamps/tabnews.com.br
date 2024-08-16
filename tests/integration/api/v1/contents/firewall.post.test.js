import { version as uuidVersion } from 'uuid';

import content from 'models/content.js';
import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeEach(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
  await orchestrator.deleteAllEmails();
});

describe('POST /api/v1/contents [FIREWALL]', () => {
  async function createContentViaApi(contentsRequestBuilder, body) {
    return await contentsRequestBuilder.post({
      title: body?.title ?? `New content - ${new Date().getTime()}`,
      body: 'body',
      status: 'published',
      parent_id: body?.parent_id,
    });
  }

  describe('Default user', () => {
    describe('Root content', () => {
      test('Spamming valid "root" contents', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder);
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder);
        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          title: 'Título 3',
        });

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);
        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({
          where: {
            id: response1Body.id,
          },
        });

        const content2 = await content.findOne({
          where: {
            id: response2Body.id,
          },
        });

        const content3 = await content.findOne({
          where: {
            slug: 'titulo-3',
          },
        });

        expect(content1.status).toBe('firewall');
        expect(content1.deleted_at).toBeNull();
        expect(Date.parse(content1.updated_at)).not.toBeNaN();
        expect(content1.updated_at.toISOString()).toBe(response1Body.updated_at);

        expect(content2.status).toBe('firewall');
        expect(content2.deleted_at).toBeNull();
        expect(Date.parse(content2.updated_at)).not.toBeNaN();
        expect(content2.updated_at.toISOString()).toBe(response2Body.updated_at);

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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "root" contents with a content deleted', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder);
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        const content2BeforeFirewall = await orchestrator.updateContent(response2Body.id, {
          status: 'deleted',
        });

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          title: 'Título 3',
        });

        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({
          where: {
            id: response1Body.id,
          },
        });

        const content2 = await content.findOne({
          where: {
            id: response2Body.id,
          },
        });

        const content3 = await content.findOne({
          where: {
            slug: 'titulo-3',
          },
        });

        expect(content1.status).toBe('firewall');
        expect(content2.status).toBe('firewall');
        expect(content1.deleted_at).toBeNull();
        expect(content2.deleted_at).toStrictEqual(content2BeforeFirewall.deleted_at);
        expect(content2.deleted_at).not.toBeNull();
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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "root" contents with TabCoins earnings', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder);
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        await orchestrator.createRate(response1Body, 10);
        const content1BeforeFirewall = await orchestrator.updateContent(response1Body.id, { status: 'deleted' });

        await orchestrator.createRate(response2Body, -3);
        await orchestrator.createRate(response2Body, 5);

        const userAfterRates = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(userAfterRates.tabcoins).toBe(2);

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          title: 'Título 3',
        });

        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({ where: { id: response1Body.id } });
        const content2 = await content.findOne({ where: { id: response2Body.id } });
        const content3 = await content.findOne({ where: { slug: 'titulo-3' } });

        expect(content1.status).toBe('firewall');
        expect(Date.parse(content1.deleted_at)).not.toBeNaN();
        expect(content1.deleted_at.toISOString()).toBe(content1BeforeFirewall.deleted_at.toISOString());
        expect(Date.parse(content1.updated_at)).not.toBeNaN();
        expect(content1.updated_at.toISOString()).toBe(content1BeforeFirewall.updated_at.toISOString());

        expect(content2.status).toBe('firewall');
        expect(content2.deleted_at).toBeNull();
        expect(Date.parse(content2.updated_at)).not.toBeNaN();
        expect(content2.updated_at.toISOString()).toBe(response2Body.updated_at);

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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const userAfterFirewallCatch = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(userAfterFirewallCatch.tabcoins).toBe(0);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Different users spamming valid "root" contents with TabCoins earnings', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

        const user1 = await contentsRequestBuilder.buildUser();
        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder);

        const user2 = await contentsRequestBuilder.buildUser();
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        await orchestrator.createRate(response1Body, 4);
        await orchestrator.createRate(response2Body, 2);

        const user1AfterRates = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterRates.tabcoins).toBe(4);

        const user2AfterRates = await user.findOneById(user2.id, { withBalance: true });
        expect(user2AfterRates.tabcoins).toBe(2);

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          title: 'Título 3',
        });

        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({ where: { id: response1Body.id } });
        const content2 = await content.findOne({ where: { id: response2Body.id } });
        const content3 = await content.findOne({ where: { slug: 'titulo-3' } });

        expect(content1.status).toBe('firewall');
        expect(content1.deleted_at).toBeNull();
        expect(Date.parse(content1.updated_at)).not.toBeNaN();
        expect(content1.updated_at.toISOString()).toBe(response1Body.updated_at);

        expect(content2.status).toBe('firewall');
        expect(content2.deleted_at).toBeNull();
        expect(Date.parse(content2.updated_at)).not.toBeNaN();
        expect(content2.updated_at.toISOString()).toBe(response2Body.updated_at);

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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const user1AfterFirewallCatch = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterFirewallCatch.tabcoins).toBe(0);

        const user2AfterFirewallCatch = await user.findOneById(user2.id, { withBalance: true });
        expect(user2AfterFirewallCatch.tabcoins).toBe(0);

        const allEmails = await orchestrator.getEmails();
        const email = allEmails[0];

        expect(allEmails).toHaveLength(1);
        expect(email.recipients).toStrictEqual([`<${user1.email}>`]);
        expect(email.subject).toBe('Um conteúdo seu foi removido');
        expect(email.text).toContain(user1.username);
        expect(email.html).toContain(user1.username);

        const deletedContentText = `Identificamos a criação de muitas publicações em um curto período, então a sua publicação "${response1Body.title}" foi removida.`;
        expect(email.text).toContain(deletedContentText);
        expect(email.html).toContain(deletedContentText.replaceAll('"', '&quot;'));

        expect(email.text).toContain(`Identificador do evento: ${lastEvent.id}`);
        expect(email.html).toContain('Identificador do evento');
        expect(email.html).toContain(lastEvent.id);
      });

      test('Spamming valid "root" contents deleted before the firewall catch', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        await contentsRequestBuilder.buildUser();

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder);
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        await orchestrator.updateContent(response1Body.id, { status: 'deleted' });
        await orchestrator.updateContent(response2Body.id, { status: 'deleted' });

        const { response: request3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(request3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitas publicações em um curto período, então publicações criadas recentemente podem ter sido removidas.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({
          where: {
            id: response1Body.id,
          },
        });

        const content2 = await content.findOne({
          where: {
            id: response2Body.id,
          },
        });

        const content3 = await content.findOne({
          where: {
            slug: 'titulo-3',
          },
        });

        expect(content1.status).toBe('firewall');
        expect(content2.status).toBe('firewall');
        expect(content3).toBeUndefined();

        const lastEvent = await orchestrator.getLastEvent();

        expect(lastEvent.metadata).toStrictEqual({
          from_rule: 'create:content:text_root',
          contents: [content1.id, content2.id],
        });
      });
    });

    describe('Child content', () => {
      test('Spamming valid "child" contents', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContentBody } = await createContentViaApi(contentsRequestBuilder);

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });
        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);
        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({
          where: {
            id: response1Body.id,
          },
        });

        const content2 = await content.findOne({
          where: {
            id: response2Body.id,
          },
        });

        const content3 = await content.findOne({
          where: {
            slug: 'titulo-3',
          },
        });

        expect(content1.status).toBe('firewall');
        expect(content1.deleted_at).toBeNull();
        expect(Date.parse(content1.updated_at)).not.toBeNaN();
        expect(content1.updated_at.toISOString()).toBe(response1Body.updated_at);

        expect(content2.status).toBe('firewall');
        expect(content2.deleted_at).toBeNull();
        expect(Date.parse(content2.updated_at)).not.toBeNaN();
        expect(content2.updated_at.toISOString()).toBe(response2Body.updated_at);

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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "child" contents with a content deleted', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContentBody } = await createContentViaApi(contentsRequestBuilder);

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        const content2BeforeFirewall = await orchestrator.updateContent(response2Body.id, {
          status: 'deleted',
        });

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });

        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({
          where: {
            id: response1Body.id,
          },
        });

        const content2 = await content.findOne({
          where: {
            id: response2Body.id,
          },
        });

        const content3 = await content.findOne({
          where: {
            slug: 'titulo-3',
          },
        });

        expect(content1.status).toBe('firewall');
        expect(content2.status).toBe('firewall');
        expect(content1.deleted_at).toBeNull();
        expect(content2.deleted_at).toStrictEqual(content2BeforeFirewall.deleted_at);
        expect(content2.deleted_at).not.toBeNull();
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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "child" contents with TabCoins earnings', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContentBody } = await createContentViaApi(contentsRequestBuilder);

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        await orchestrator.createRate(response1Body, 2);
        const content1BeforeFirewall = await orchestrator.updateContent(response1Body.id, {
          status: 'deleted',
        });

        await orchestrator.createRate(response2Body, 10);
        await orchestrator.createRate(response2Body, -4);

        const userAfterRates = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(userAfterRates.tabcoins).toBe(6);

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });

        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({ where: { id: response1Body.id } });
        const content2 = await content.findOne({ where: { id: response2Body.id } });
        const content3 = await content.findOne({ where: { slug: 'titulo-3' } });

        expect(content1.status).toBe('firewall');
        expect(Date.parse(content1.deleted_at)).not.toBeNaN();
        expect(content1.deleted_at.toISOString()).toBe(content1BeforeFirewall.deleted_at.toISOString());
        expect(Date.parse(content1.updated_at)).not.toBeNaN();
        expect(content1.updated_at.toISOString()).toBe(content1BeforeFirewall.updated_at.toISOString());

        expect(content2.status).toBe('firewall');
        expect(content2.deleted_at).toBeNull();
        expect(Date.parse(content2.updated_at)).not.toBeNaN();
        expect(content2.updated_at.toISOString()).toBe(response2Body.updated_at);

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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const userAfterFirewallCatch = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(userAfterFirewallCatch.tabcoins).toBe(0);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(0);
      });

      test('Spamming valid "child" contents with one with negative TabCoins', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContentBody } = await createContentViaApi(contentsRequestBuilder);

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        await orchestrator.createRate(response1Body, 1);
        await orchestrator.createRate(response1Body, -5);
        await orchestrator.createRate(response2Body, 3);

        const userAfterRates = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(userAfterRates.tabcoins).toBe(-1);

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });

        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({ where: { id: response1Body.id } });
        const content2 = await content.findOne({ where: { id: response2Body.id } });
        const content3 = await content.findOne({ where: { slug: 'titulo-3' } });

        expect(content1.status).toBe('firewall');
        expect(content2.status).toBe('firewall');
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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const userAfterFirewallCatch = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(userAfterFirewallCatch.tabcoins).toBe(-4);
      });

      test('Different users spamming valid "child" contents with TabCoins earnings', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

        const userRootContent = await contentsRequestBuilder.buildUser();
        const { responseBody: rootContentBody } = await createContentViaApi(contentsRequestBuilder);

        await user.update(userRootContent, { notifications: false });

        const user1 = await contentsRequestBuilder.buildUser();
        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });

        const user2 = await contentsRequestBuilder.buildUser();
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
        });

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);

        await orchestrator.createRate(response1Body, 2);
        await orchestrator.createRate(response2Body, 1);

        const user1AfterRates = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterRates.tabcoins).toBe(2);

        const user2AfterRates = await user.findOneById(user2.id, { withBalance: true });
        expect(user2AfterRates.tabcoins).toBe(1);

        const user3 = await contentsRequestBuilder.buildUser();
        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });

        expect.soft(response3.status).toBe(429);

        expect(response3Body).toStrictEqual({
          name: 'TooManyRequestsError',
          message:
            'Identificamos a criação de muitos comentários em um curto período, então comentários criados recentemente podem ter sido removidos.',
          action: 'Tente novamente mais tarde ou contate o suporte caso acredite que isso seja um erro.',
          status_code: 429,
          error_id: response3Body.error_id,
          request_id: response3Body.request_id,
        });

        const content1 = await content.findOne({ where: { id: response1Body.id } });
        const content2 = await content.findOne({ where: { id: response2Body.id } });
        const content3 = await content.findOne({ where: { slug: 'titulo-3' } });

        expect(content1.status).toBe('firewall');
        expect(content1.deleted_at).toBeNull();
        expect(Date.parse(content1.updated_at)).not.toBeNaN();
        expect(content1.updated_at.toISOString()).toBe(response1Body.updated_at);

        expect(content2.status).toBe('firewall');
        expect(content2.deleted_at).toBeNull();
        expect(Date.parse(content2.updated_at)).not.toBeNaN();
        expect(content2.updated_at.toISOString()).toBe(response2Body.updated_at);

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
        expect(uuidVersion(lastEvent.id)).toBe(4);
        expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

        const user1AfterFirewallCatch = await user.findOneById(user1.id, {
          withBalance: true,
        });
        expect(user1AfterFirewallCatch.tabcoins).toBe(0);

        const user2AfterFirewallCatch = await user.findOneById(user2.id, {
          withBalance: true,
        });
        expect(user2AfterFirewallCatch.tabcoins).toBe(0);

        const allEmails = await orchestrator.getEmails();
        expect(allEmails).toHaveLength(2);

        const user1Email = allEmails.find((email) => email.recipients.includes(`<${user1.email}>`));
        const user2Email = allEmails.find((email) => email.recipients.includes(`<${user2.email}>`));

        expect(user1Email.recipients).toStrictEqual([`<${user1.email}>`]);
        expect(user2Email.recipients).toStrictEqual([`<${user2.email}>`]);

        expect(user1Email.subject).toBe('Um conteúdo seu foi removido');
        expect(user2Email.subject).toBe('Um conteúdo seu foi removido');

        expect(user1Email.text).toContain(user1.username);
        expect(user1Email.html).toContain(user1.username);
        expect(user2Email.text).toContain(user2.username);
        expect(user2Email.html).toContain(user2.username);

        const user1DeletedContentText = `Identificamos a criação de muitos comentários em um curto período, então o seu comentário de ID "${content1.id}" foi removido.`;
        expect(user1Email.text).toContain(user1DeletedContentText);
        expect(user1Email.html).toContain(user1DeletedContentText.replaceAll('"', '&quot;'));

        const user2DeletedContentText = `Identificamos a criação de muitos comentários em um curto período, então o seu comentário de ID "${content2.id}" foi removido.`;
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
