import { version as uuidVersion } from 'uuid';

import content from 'models/content.js';
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

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);

        const content2BeforeFirewall = await orchestrator.updateContent(response2Body.id, {
          status: 'deleted',
        });

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          title: 'Título 3',
        });

        expect(response3.status).toBe(429);

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

      test('Spamming valid "root" contents deleted before the firewall catch', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        await contentsRequestBuilder.buildUser();

        const { response: response1, responseBody: response1Body } = await createContentViaApi(contentsRequestBuilder);
        const { response: response2, responseBody: response2Body } = await createContentViaApi(contentsRequestBuilder);

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);

        await orchestrator.updateContent(response1Body.id, { status: 'deleted' });
        await orchestrator.updateContent(response2Body.id, { status: 'deleted' });

        const { response: request3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder);

        expect(request3.status).toBe(429);

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

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);

        const content2BeforeFirewall = await orchestrator.updateContent(response2Body.id, {
          status: 'deleted',
        });

        const { response: response3, responseBody: response3Body } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContentBody.id,
          title: 'Título 3',
        });

        expect(response3.status).toBe(429);

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
    });
  });
});
