import { randomUUID } from 'node:crypto';
import { version as uuidVersion } from 'uuid';

import content from 'models/content';
import event from 'models/event';
import orchestrator from 'tests/orchestrator';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('GET /api/v1/events/firewall/[id]', () => {
  async function createContentViaApi(contentsRequestBuilder, body) {
    return contentsRequestBuilder.post({
      title: body?.title ?? `New content - ${new Date().getTime()}`,
      body: 'body',
      status: 'published',
      parent_id: body?.parent_id,
    });
  }

  function mapContentData(content) {
    return {
      body: content.body,
      children_deep_count: +content.children_deep_count,
      created_at: content.created_at.toISOString(),
      deleted_at: content.deleted_at?.toISOString() ?? null,
      id: content.id,
      owner_id: content.owner_id,
      owner_username: content.owner_username,
      parent_id: content.parent_id,
      published_at: content.published_at.toISOString(),
      slug: content.slug,
      source_url: content.source_url,
      status: content.status,
      tabcoins: +content.tabcoins,
      tabcoins_credit: +content.tabcoins_credit,
      tabcoins_debit: +content.tabcoins_debit,
      title: content.title,
      updated_at: content.updated_at.toISOString(),
    };
  }

  describe('Anonymous user', () => {
    test('Should not retrieve firewall event', async () => {
      const eventId = randomUUID();
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall/${eventId}`);
      const { response, responseBody } = await firewallRequestBuilder.get();

      expect(response.status).toEqual(403);

      expect(responseBody).toEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:firewall".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('Default user', () => {
    test('Should not retrieve firewall event', async () => {
      const eventId = randomUUID();

      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall/${eventId}`);
      await firewallRequestBuilder.buildUser();

      const { response, responseBody } = await firewallRequestBuilder.get();

      expect(response.status).toEqual(403);

      expect(responseBody).toEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:firewall".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('User with "read:firewall" feature', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
      await orchestrator.createFirewallTestFunctions();
    });

    test('With a malformatted string as "id"', async () => {
      const firewallRequestBuilder = new RequestBuilder('/api/v1/events/firewall/random');
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      const { response, responseBody } = await firewallRequestBuilder.get();

      expect(response.status).toEqual(400);

      expect(responseBody).toEqual({
        name: 'ValidationError',
        message: '"id" deve possuir um token UUID na versão 4.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'id',
        type: 'string.guid',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With an "id" that does not exist', async () => {
      const eventId = randomUUID();
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall/${eventId}`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      const { response, responseBody } = await firewallRequestBuilder.get();

      expect(response.status).toEqual(404);

      expect(responseBody).toEqual({
        name: 'NotFoundError',
        message: `O id "${eventId}" não foi encontrado no sistema.`,
        action: 'Verifique se o "id" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:FIND_BY_EVENT_ID:NOT_FOUND',
        key: 'id',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With an "id" that is not a firewall event', async () => {
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const user = await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      await orchestrator.createContent({
        owner_id: user.id,
        title: 'Create event',
      });
      const contentEvent = (await event.findAll())[0];

      const { response, responseBody } = await firewallRequestBuilder.get(`/${contentEvent.id}`);

      expect(response.status).toEqual(404);

      expect(responseBody).toEqual({
        name: 'NotFoundError',
        message: `O id "${contentEvent.id}" não foi encontrado no sistema.`,
        action: 'Verifique se o "id" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:FIND_BY_EVENT_ID:NOT_FOUND',
        key: 'id',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With a "firewall:block_users" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create users
      const { responseBody: user1 } = await usersRequestBuilder.post({
        username: 'firstUser',
        email: 'first-user@gmail.com',
        password: 'password',
      });
      const { responseBody: user2 } = await usersRequestBuilder.post({
        username: 'secondUser',
        email: 'second-user@gmail.com',
        password: 'password',
      });
      const { response: user3Response } = await usersRequestBuilder.post({
        username: 'thirdUser',
        email: 'third-user@gmail.com',
        password: 'password',
      });

      expect(user3Response.status).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      await usersRequestBuilder.setUser(user1);
      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      await usersRequestBuilder.setUser(user2);
      const { responseBody: user2AfterFirewall } = await usersRequestBuilder.get(`/${user2.username}`);

      expect(responseBody).toEqual({
        affected: {
          users: [user1AfterFirewall, user2AfterFirewall],
        },
        events: [
          {
            created_at: responseBody.events[0].created_at,
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: [user1AfterFirewall.id, user2AfterFirewall.id],
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
        ],
      });

      expect(Date.parse(responseBody.events[0].created_at)).not.toEqual(NaN);
    });

    test('With a reversed "firewall:block_users" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall', 'undo:firewall'] });

      // Create users
      const { responseBody: user1 } = await usersRequestBuilder.post({
        username: 'firstUser',
        email: 'first-user@gmail.com',
        password: 'password',
      });
      const { responseBody: user2 } = await usersRequestBuilder.post({
        username: 'secondUser',
        email: 'second-user@gmail.com',
        password: 'password',
      });
      const { response: user3Response } = await usersRequestBuilder.post({
        username: 'thirdUser',
        email: 'third-user@gmail.com',
        password: 'password',
      });

      expect(user3Response.status).toEqual(429);

      // Check firewall side-effect
      let allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      expect(firewallEvent.type).toEqual('firewall:block_users');
      expect(firewallEvent.metadata.users).toEqual([user1.id, user2.id]);

      // Undo firewall side-effect
      const undoFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/undo_firewall/${firewallEvent.id}`);
      await undoFirewallRequestBuilder.setUser(firewallUser);
      const { response: undoResponse } = await undoFirewallRequestBuilder.post();
      expect(undoResponse.status).toEqual(200);

      // Get reversed firewall event
      allEvents = await event.findAll();
      const reversedEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      const { responseBody: user1AfterReverse } = await usersRequestBuilder.get(`/${user1.username}`);
      const { responseBody: user2AfterReverse } = await usersRequestBuilder.get(`/${user2.username}`);

      expect(responseBody).toEqual({
        affected: {
          users: [user1AfterReverse, user2AfterReverse],
        },
        events: [
          {
            created_at: firewallEvent.created_at.toISOString(),
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: [user1AfterReverse.id, user2AfterReverse.id],
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
          {
            created_at: responseBody.events[1].created_at,
            id: reversedEvent.id,
            metadata: {
              original_event_id: firewallEvent.id,
              users: [user1AfterReverse.id, user2AfterReverse.id],
            },
            originator_user_id: firewallUser.id,
            type: 'moderation:unblock_users',
          },
        ],
      });

      expect(Date.parse(responseBody.events[1].created_at)).not.toEqual(NaN);
    });

    test('With a "firewall:block_contents:text_root" event', async () => {
      const usersRequestBuilder = new RequestBuilder(`/api/v1/users`);
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      let user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall],
        },
        events: [
          {
            created_at: responseBody.events[0].created_at,
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:content:text_root',
              contents: [content1.id, content2.id],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_root',
          },
        ],
      });

      expect(Date.parse(responseBody.events[0].created_at)).not.toEqual(NaN);
    });

    test('With a reversed "firewall:block_contents:text_root" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall', 'undo:firewall'] });

      // Create users and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      let user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toEqual(429);

      // Check firewall side-effect
      let allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      expect(firewallEvent.type).toEqual('firewall:block_contents:text_root');
      expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const undoFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/undo_firewall/${firewallEvent.id}`);
      await undoFirewallRequestBuilder.setUser(firewallUser);
      const { response: undoResponse } = await undoFirewallRequestBuilder.post();

      expect(undoResponse.status).toEqual(200);

      // Get reversed firewall event
      allEvents = await event.findAll();
      const reversedEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall],
        },
        events: [
          {
            created_at: firewallEvent.created_at.toISOString(),
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:content:text_root',
              contents: [content1AfterFirewall.id, content2AfterFirewall.id],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_root',
          },
          {
            created_at: responseBody.events[1].created_at,
            id: reversedEvent.id,
            metadata: {
              contents: [content1AfterFirewall.id, content2AfterFirewall.id],
              original_event_id: firewallEvent.id,
            },
            originator_user_id: firewallUser.id,
            type: 'moderation:unblock_contents:text_root',
          },
        ],
      });

      expect(Date.parse(responseBody.events[1].created_at)).not.toEqual(NaN);
    });

    test('With a "firewall:block_contents:text_root" and contents deleted before the firewall catch', async () => {
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      let user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);

      await orchestrator.updateContent(content1.id, { status: 'deleted' });
      await orchestrator.updateContent(content2.id, { status: 'deleted' });

      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      expect(responseBody).toEqual({
        affected: {
          contents: [],
          users: [],
        },
        events: [
          {
            created_at: responseBody.events[0].created_at,
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:content:text_root',
              contents: [],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_root',
          },
        ],
      });

      expect(Date.parse(responseBody.events[0].created_at)).not.toEqual(NaN);
    });

    test('With a "firewall:block_contents:text_child" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.setUser(firewallUser);

      const { responseBody: rootContent } = await createContentViaApi(contentsRequestBuilder);

      let user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });

      expect(responseContent3.status).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall],
        },
        events: [
          {
            created_at: responseBody.events[0].created_at,
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:content:text_child',
              contents: [content1.id, content2.id],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_child',
          },
        ],
      });

      expect(Date.parse(responseBody.events[0].created_at)).not.toEqual(NaN);
    });

    test('With a reversed "firewall:block_contents:text_child" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall', 'undo:firewall'] });

      // Create users and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.setUser(firewallUser);

      const { responseBody: rootContent } = await createContentViaApi(contentsRequestBuilder);

      let user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });

      expect(responseContent3.status).toEqual(429);

      // Check firewall side-effect
      let allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      expect(firewallEvent.type).toEqual('firewall:block_contents:text_child');
      expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const undoFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/undo_firewall/${firewallEvent.id}`);
      await undoFirewallRequestBuilder.setUser(firewallUser);
      const { response: undoResponse } = await undoFirewallRequestBuilder.post();

      expect(undoResponse.status).toEqual(200);

      // Get reversed firewall event
      allEvents = await event.findAll();
      const reversedEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall],
        },
        events: [
          {
            created_at: firewallEvent.created_at.toISOString(),
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:content:text_child',
              contents: [content1AfterFirewall.id, content2AfterFirewall.id],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_child',
          },
          {
            created_at: responseBody.events[1].created_at,
            id: reversedEvent.id,
            metadata: {
              contents: [content1AfterFirewall.id, content2AfterFirewall.id],
              original_event_id: firewallEvent.id,
            },
            originator_user_id: firewallUser.id,
            type: 'moderation:unblock_contents:text_child',
          },
        ],
      });

      expect(Date.parse(responseBody.events[1].created_at)).not.toEqual(NaN);
    });

    test('With a "firewall:block_contents:text_child" event involving multiple users', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.setUser(firewallUser);

      const rootContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Root content',
      });

      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });

      const user2 = await contentsRequestBuilder.buildUser();

      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });

      expect(responseContent3.status).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);
      const { responseBody: user2AfterFirewall } = await usersRequestBuilder.get(`/${user2.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall, user2AfterFirewall],
        },
        events: [
          {
            created_at: responseBody.events[0].created_at,
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:content:text_child',
              contents: [content1.id, content2.id],
            },
            originator_user_id: user2.id,
            type: 'firewall:block_contents:text_child',
          },
        ],
      });

      expect(Date.parse(responseBody.events[0].created_at)).not.toEqual(NaN);
    });
  });
});
