import { randomUUID } from 'node:crypto';
import { version as uuidVersion } from 'uuid';

import content from 'models/content';
import user from 'models/user';
import orchestrator from 'tests/orchestrator';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('GET /api/v1/events/firewall/[id]', () => {
  describe('Anonymous user', () => {
    test('Should not retrieve firewall event', async () => {
      const eventId = randomUUID();
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall/${eventId}`);
      const { response, responseBody } = await firewallRequestBuilder.get();

      expect.soft(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:firewall".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('Default user', () => {
    test('Should not retrieve firewall event', async () => {
      const eventId = randomUUID();

      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall/${eventId}`);
      await firewallRequestBuilder.buildUser();

      const { response, responseBody } = await firewallRequestBuilder.get();

      expect.soft(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:firewall".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
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

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
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

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an "id" that does not exist', async () => {
      const eventId = randomUUID();
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall/${eventId}`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      const { response, responseBody } = await firewallRequestBuilder.get();

      expect.soft(response.status).toBe(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: `O id "${eventId}" não foi encontrado no sistema.`,
        action: 'Verifique se o "id" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:FIND_BY_EVENT_ID:NOT_FOUND',
        key: 'id',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an "id" that is not a firewall event', async () => {
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const user = await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      await orchestrator.createContent({
        owner_id: user.id,
        status: 'published',
        title: 'Create event',
      });
      const lastEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${lastEvent.id}`);

      expect.soft(response.status).toBe(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: `O id "${lastEvent.id}" não foi encontrado no sistema.`,
        action: 'Verifique se o "id" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:FIND_BY_EVENT_ID:NOT_FOUND',
        key: 'id',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
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

      expect(user3Response.status).toBe(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect.soft(response.status).toBe(200);

      const expectedAffectedUsers = mapAffectedUsersData(user1, user2);

      expect(responseBody).toStrictEqual({
        affected: {
          users: expectedAffectedUsers,
        },
        events: [
          {
            created_at: firewallEvent.created_at.toISOString(),
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: expectedAffectedUsers.map((user) => user.id),
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
        ],
      });
    });

    test('With two consecutive "firewall:block_users" events from the same IP', async () => {
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

      expect(user3Response.status).toBe(429);

      const firstFirewallEvent = await orchestrator.getLastEvent();

      const { response: user4Response } = await usersRequestBuilder.post({
        username: 'fourthUser',
        email: 'fourth-user@gmail.com',
        password: 'password',
      });

      expect(user4Response.status).toBe(429);

      const secondFirewallEvent = await orchestrator.getLastEvent();

      expect(firstFirewallEvent.id).not.toBe(secondFirewallEvent.id);

      // Get firewall side-effects
      const { response: firstFirewallResponse, responseBody: firstFirewallResponseBody } =
        await firewallRequestBuilder.get(`/${firstFirewallEvent.id}`);
      const { response: secondFirewallResponse, responseBody: secondFirewallResponseBody } =
        await firewallRequestBuilder.get(`/${secondFirewallEvent.id}`);

      expect.soft(firstFirewallResponse.status).toBe(200);
      expect.soft(secondFirewallResponse.status).toBe(200);

      const expectedAffectedUsers = mapAffectedUsersData(user1, user2);

      const expectedEvents = mapEventsData([firstFirewallEvent, secondFirewallEvent], {
        metadata: {
          from_rule: 'create:user',
          users: expectedAffectedUsers.map((user) => user.id),
        },
        type: 'firewall:block_users',
      });

      expect(expectedEvents).toStrictEqual(expect.arrayContaining(firstFirewallResponseBody.events));
      expect(firstFirewallResponseBody).toStrictEqual({
        affected: {
          users: expectedAffectedUsers,
        },
        events: expect.arrayContaining(expectedEvents),
      });

      expect(expectedEvents).toStrictEqual(expect.arrayContaining(secondFirewallResponseBody.events));
      expect(secondFirewallResponseBody).toStrictEqual({
        affected: {
          users: expectedAffectedUsers,
        },
        events: expect.arrayContaining(expectedEvents),
      });
    });

    test.each([
      {
        action: 'undo',
        eventType: 'moderation:unblock_users',
      },
      {
        action: 'confirm',
        eventType: 'moderation:block_users',
      },
    ])('With a review $action "firewall:block_users" event', async ({ action, eventType }) => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

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

      expect(user3Response.status).toBe(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toBe('firewall:block_users');
      expect(firewallEvent.metadata.users).toStrictEqual([user1.id, user2.id]);

      // Review firewall side-effect
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.setUser(firewallUser);
      const { response: reviewResponse } = await reviewFirewallRequestBuilder.post({ action: action });
      expect(reviewResponse.status).toBe(200);

      // Get reviewed firewall event
      const reviewEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      const user1AfterFirewall = await user.findOneById(user1.id);
      const user2AfterFirewall = await user.findOneById(user2.id);

      const expectedEvents = mapEventsData([
        {
          ...firewallEvent,
          metadata: {
            users: [user1.id, user2.id],
            from_rule: 'create:user',
          },
          type: 'firewall:block_users',
        },
        {
          ...reviewEvent,
          metadata: {
            users: [user1.id, user2.id],
            related_events: [firewallEvent.id],
          },
          type: eventType,
        },
      ]);

      expect.soft(response.status).toBe(200);

      expect.soft(expectedEvents).toStrictEqual(expect.arrayContaining(responseBody.events));
      expect(responseBody).toStrictEqual({
        affected: {
          users: mapUsersData(user1AfterFirewall, user2AfterFirewall),
        },
        events: expect.arrayContaining(expectedEvents),
      });
    });

    test('With a "firewall:block_contents:text_root" event', async () => {
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toBe(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect.soft(response.status).toBe(200);

      const expectedAffectedUsers = mapUsersData(user1);

      const expectedAffectedContents = mapAffectedContentsData(content1, content2);

      expect(responseBody).toStrictEqual({
        affected: {
          contents: expectedAffectedContents,
          users: expectedAffectedUsers,
        },
        events: [
          {
            created_at: firewallEvent.created_at.toISOString(),
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
    });

    test('With two consecutive "firewall:block_contents:text_root" events (same time window)', async () => {
      const firewallRequestBuilder = new RequestBuilder('/api/v1/events/firewall/');
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const owner = await contentsRequestBuilder.buildUser();

      const content1 = await createContentViaApi(contentsRequestBuilder);
      expect.soft(content1.response.status).toBe(201);
      const content1CreateContentEvent = await orchestrator.getLastEvent();

      const content2 = await createContentViaApi(contentsRequestBuilder);
      expect.soft(content2.response.status).toBe(201);

      const content3 = await createContentViaApi(contentsRequestBuilder);
      expect.soft(content3.response.status).toBe(429);

      const firewallEvent1 = await orchestrator.getLastEvent();
      const firewall1Get1 = await firewallRequestBuilder.get(firewallEvent1.id);
      expect.soft(firewall1Get1.response.status).toBe(200);

      // Update content1 event to simulate a different `firewall`, but same `affected` time window
      await orchestrator.updateEventCreatedAt(content1CreateContentEvent.id, new Date(Date.now() - 1000 * 6));

      const content4 = await createContentViaApi(contentsRequestBuilder);
      expect.soft(content4.response.status).toBe(201);

      const content5 = await createContentViaApi(contentsRequestBuilder);
      expect.soft(content5.response.status).toBe(429);

      const firewallEvent2 = await orchestrator.getLastEvent();
      expect.soft(firewallEvent1.id).not.toBe(firewallEvent2.id);

      const firewall1Get2 = await firewallRequestBuilder.get(firewallEvent1.id);
      expect.soft(firewall1Get2.response.status).toBe(200);

      const firewall2Get = await firewallRequestBuilder.get(firewallEvent2.id);
      expect.soft(firewall2Get.response.status).toBe(200);

      const expectedAffected1 = mapAffectedContentsData(content1, content2);
      const expectedAffected2 = mapAffectedContentsData(content1, content2, content4);
      const expectedAllAffected = expectedAffected2;
      const expectedUsers = mapUsersData(owner);
      const expectedEvents = mapEventsData(
        [
          {
            ...firewallEvent1,
            metadata: {
              contents: expect.arrayContaining(expectedAffected1.map((content) => content.id)),
            },
          },
          {
            ...firewallEvent2,
            metadata: {
              contents: expect.arrayContaining(expectedAffected2.map((content) => content.id)),
            },
          },
        ],
        {
          metadata: {
            from_rule: 'create:content:text_root',
          },
          originator_user_id: owner.id,
          type: 'firewall:block_contents:text_root',
        },
      );

      expect.soft(expectedAffected1).toEqual(expect.arrayContaining(firewall1Get1.responseBody.affected.contents));
      expect(firewall1Get1.responseBody).toStrictEqual({
        affected: {
          contents: expect.arrayContaining(expectedAffected1),
          users: expectedUsers,
        },
        events: [expectedEvents[0]],
      });

      expect.soft(expectedAllAffected).toEqual(expect.arrayContaining(firewall1Get2.responseBody.affected.contents));
      expect.soft(expectedEvents).toEqual(expect.arrayContaining(firewall1Get2.responseBody.events));
      expect(firewall1Get2.responseBody).toStrictEqual({
        affected: {
          contents: expect.arrayContaining(expectedAllAffected),
          users: expectedUsers,
        },
        events: expect.arrayContaining(expectedEvents),
      });

      expect.soft(expectedAllAffected).toEqual(expect.arrayContaining(firewall2Get.responseBody.affected.contents));
      expect.soft(expectedEvents).toEqual(expect.arrayContaining(firewall2Get.responseBody.events));
      expect(firewall2Get.responseBody).toStrictEqual({
        affected: {
          contents: expect.arrayContaining(expectedAllAffected),
          users: expectedUsers,
        },
        events: expect.arrayContaining(expectedEvents),
      });
    });

    test('With a "firewall:block_contents:text_root" and contents deleted before the firewall catch', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);

      await orchestrator.updateContent(content1.id, { status: 'deleted' });
      await orchestrator.updateContent(content2.id, { status: 'deleted' });

      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toBe(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect.soft(response.status).toBe(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toStrictEqual({
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
              contents: [content1.id, content2.id],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_root',
          },
        ],
      });
    });

    test.each([
      {
        action: 'undo',
        eventType: 'moderation:unblock_contents:text_root',
      },
      {
        action: 'confirm',
        eventType: 'moderation:block_contents:text_root',
      },
    ])('With a review $action "firewall:block_contents:text_root" event', async ({ action, eventType }) => {
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      // Create users and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toBe(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toBe('firewall:block_contents:text_root');
      expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

      // Review firewall side-effect
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.setUser(firewallUser);
      const { response: reviewResponse } = await reviewFirewallRequestBuilder.post({ action: action });

      expect(reviewResponse.status).toBe(200);

      // Get reviewed firewall event
      const reviewEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      const user1AfterFirewall = await user.findOneById(user1.id);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      const expectedEvents = mapEventsData([
        {
          ...firewallEvent,
          metadata: {
            from_rule: 'create:content:text_root',
            contents: [content1.id, content2.id],
          },
          type: 'firewall:block_contents:text_root',
        },
        {
          ...reviewEvent,
          metadata: {
            contents: [content1.id, content2.id],
            related_events: [firewallEvent.id],
          },
          type: eventType,
        },
      ]);

      expect.soft(response.status).toBe(200);

      expect.soft(expectedEvents).toEqual(expect.arrayContaining(responseBody.events));
      expect(responseBody).toStrictEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: mapUsersData(user1AfterFirewall),
        },
        events: expect.arrayContaining(expectedEvents),
      });
    });

    test('With a "firewall:block_contents:text_child" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.setUser(firewallUser);

      const { responseBody: rootContent } = await createContentViaApi(contentsRequestBuilder);

      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });

      expect(responseContent3.status).toBe(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect.soft(response.status).toBe(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toStrictEqual({
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
              contents: [content1.id, content2.id],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_child',
          },
        ],
      });
    });

    test.each([
      {
        action: 'undo',
        eventType: 'moderation:unblock_contents:text_child',
      },
      {
        action: 'confirm',
        eventType: 'moderation:block_contents:text_child',
      },
    ])('With a review $action "firewall:block_contents:text_child" event', async ({ action, eventType }) => {
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      // Create users and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.setUser(firewallUser);

      const { responseBody: rootContent } = await createContentViaApi(contentsRequestBuilder);

      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });

      expect(responseContent3.status).toBe(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toBe('firewall:block_contents:text_child');
      expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

      // Review firewall side-effect
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.setUser(firewallUser);
      const { response: reviewResponse } = await reviewFirewallRequestBuilder.post({ action: action });

      expect(reviewResponse.status).toBe(200);

      // Get reviewed firewall event
      const reviewEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      const user1AfterFirewall = await user.findOneById(user1.id);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      const expectedEvents = mapEventsData([
        {
          ...firewallEvent,
          metadata: {
            from_rule: 'create:content:text_child',
            contents: [content1.id, content2.id],
          },
          type: 'firewall:block_contents:text_child',
        },
        {
          ...reviewEvent,
          metadata: {
            contents: [content1.id, content2.id],
            related_events: [firewallEvent.id],
          },
          type: eventType,
        },
      ]);

      expect.soft(response.status).toBe(200);

      expect.soft(expectedEvents).toEqual(expect.arrayContaining(responseBody.events));
      expect(responseBody).toStrictEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: mapUsersData(user1AfterFirewall),
        },
        events: expect.arrayContaining(expectedEvents),
      });
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
        status: 'published',
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

      expect(responseContent3.status).toBe(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect.soft(response.status).toBe(200);

      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);
      const { responseBody: user2AfterFirewall } = await usersRequestBuilder.get(`/${user2.username}`);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(responseBody).toStrictEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall, user2AfterFirewall],
        },
        events: [
          {
            created_at: firewallEvent.created_at.toISOString(),
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
    });

    test('With two consecutive "firewall:block_contents:text_child" events (different time window)', async () => {
      const firewallRequestBuilder = new RequestBuilder('/api/v1/events/firewall/');
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const user1 = await contentsRequestBuilder.buildUser();

      const rootContent = await orchestrator.createContent({
        owner_id: user1.id,
        status: 'published',
        title: 'Root content',
      });

      const child1 = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      expect.soft(child1.response.status).toBe(201);
      const child1CreateContentEvent = await orchestrator.getLastEvent();

      // Update child1 event to simulate a different `firewall`, but same `affected` time window
      await orchestrator.updateEventCreatedAt(child1CreateContentEvent.id, new Date(Date.now() - 1000 * 6));

      const child2 = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      expect.soft(child2.response.status).toBe(201);
      const child2CreateContentEvent = await orchestrator.getLastEvent();

      const child3 = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      expect.soft(child3.response.status).toBe(201);

      const child4 = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      expect.soft(child4.response.status).toBe(429);

      const firewallEvent1 = await orchestrator.getLastEvent();
      const firewall1Get1 = await firewallRequestBuilder.get(firewallEvent1.id);
      expect.soft(firewall1Get1.response.status).toBe(200);

      // Update child2 event to simulate a different `firewall` time window
      await orchestrator.updateEventCreatedAt(child2CreateContentEvent.id, new Date(Date.now() - 1000 * 6));

      // Update child1 event to simulate a different `affected` time window
      await orchestrator.updateEventCreatedAt(child1CreateContentEvent.id, new Date(Date.now() - 1000 * 60 * 11));

      const user2 = await contentsRequestBuilder.buildUser();

      const child5 = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      expect.soft(child5.response.status).toBe(201);

      const child6 = await createContentViaApi(contentsRequestBuilder, {
        parent_id: rootContent.id,
      });
      expect.soft(child6.response.status).toBe(429);

      const firewallEvent2 = await orchestrator.getLastEvent();
      expect.soft(firewallEvent1.id).not.toBe(firewallEvent2.id);

      const firewall1Get2 = await firewallRequestBuilder.get(firewallEvent1.id);
      expect.soft(firewall1Get2.response.status).toBe(200);

      const firewall2Get = await firewallRequestBuilder.get(firewallEvent2.id);
      expect.soft(firewall2Get.response.status).toBe(200);

      const expectedAffected1 = mapAffectedContentsData(child1, child2, child3);
      const expectedAffected2 = mapAffectedContentsData(child2, child3, child5);
      const expectedAllAffected = mapAffectedContentsData(child1, child2, child3, child5);
      const expectedUsers = mapUsersData(user1, user2);
      const expectedEvents = mapEventsData(
        [
          {
            ...firewallEvent1,
            metadata: {
              contents: expect.arrayContaining(expectedAffected1.map((content) => content.id)),
            },
          },
          {
            ...firewallEvent2,
            metadata: {
              contents: expect.arrayContaining(expectedAffected2.map((content) => content.id)),
            },
          },
        ],
        {
          metadata: {
            from_rule: 'create:content:text_child',
          },
          type: 'firewall:block_contents:text_child',
        },
      );

      expect.soft(expectedAffected1).toEqual(expect.arrayContaining(firewall1Get1.responseBody.affected.contents));
      expect(firewall1Get1.responseBody).toStrictEqual({
        affected: {
          contents: expect.arrayContaining(expectedAffected1),
          users: [expectedUsers[0]],
        },
        events: [expectedEvents[0]],
      });

      expect.soft(expectedAllAffected).toEqual(expect.arrayContaining(firewall1Get2.responseBody.affected.contents));
      expect.soft(expectedEvents).toEqual(expect.arrayContaining(firewall1Get2.responseBody.events));
      expect(firewall1Get2.responseBody).toStrictEqual({
        affected: {
          contents: expect.arrayContaining(expectedAllAffected),
          users: expectedUsers,
        },
        events: expect.arrayContaining(expectedEvents),
      });

      expect.soft(expectedAllAffected).toEqual(expect.arrayContaining(firewall2Get.responseBody.affected.contents));
      expect.soft(expectedEvents).toEqual(expect.arrayContaining(firewall2Get.responseBody.events));
      expect(firewall2Get.responseBody).toStrictEqual({
        affected: {
          contents: expect.arrayContaining(expectedAllAffected),
          users: expectedUsers,
        },
        events: expect.arrayContaining(expectedEvents),
      });
    });
  });
});

async function createContentViaApi(contentsRequestBuilder, body) {
  return await contentsRequestBuilder.post({
    title: `New content - ${new Date().getTime()}`,
    body: 'body',
    status: 'published',
    parent_id: body?.parent_id,
  });
}

function mapContentData(content) {
  return {
    body: content.body,
    children_deep_count: +content.children_deep_count || 0,
    created_at:
      typeof content.created_at?.toISOString === 'function' ? content.created_at.toISOString() : content.created_at,
    deleted_at:
      typeof content.deleted_at?.toISOString === 'function'
        ? content.deleted_at.toISOString()
        : content.deleted_at ?? null,
    id: content.id,
    owner_id: content.owner_id,
    owner_username: content.owner_username,
    parent_id: content.parent_id,
    published_at:
      typeof content.published_at?.toISOString === 'function'
        ? content.published_at.toISOString()
        : content.published_at,
    slug: content.slug,
    source_url: content.source_url,
    status: content.status,
    tabcoins: +content.tabcoins,
    tabcoins_credit: +content.tabcoins_credit,
    tabcoins_debit: +content.tabcoins_debit,
    title: content.title,
    type: content.type,
    updated_at:
      typeof content.updated_at?.toISOString === 'function' ? content.updated_at.toISOString() : content.updated_at,
  };
}

function mapAffectedContentsData(...affected) {
  return affected.map((content) =>
    mapContentData({
      ...content,
      ...content.responseBody,
      status: 'firewall',
    }),
  );
}

function mapUsersData(...users) {
  return users.map((user) => ({
    id: user.id,
    username: user.username,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    description: user.description,
    features: user.features,
    tabcash: 0,
    tabcoins: 0,
  }));
}

function mapAffectedUsersData(...affected) {
  return affected.map((user) => ({
    ...user,
    features: [],
  }));
}

function mapEventsData(events, commonData) {
  return events.map((event) => ({
    created_at: typeof event.created_at.toISOString === 'function' ? event.created_at.toISOString() : event.created_at,
    id: event.id,
    originator_user_id: event.originator_user_id ?? null,
    type: event.type,
    ...commonData,
    metadata: {
      ...event.metadata,
      ...commonData?.metadata,
    },
  }));
}
