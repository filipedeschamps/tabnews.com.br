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
  async function createContentViaApi(contentsRequestBuilder, body) {
    return contentsRequestBuilder.post({
      title: `New content - ${new Date().getTime()}`,
      body: 'body',
      status: 'published',
      parent_id: body?.parent_id,
    });
  }

  function mapUserData(user) {
    return {
      created_at: user.created_at.toISOString(),
      description: user.description,
      features: user.features,
      id: user.id,
      tabcash: +user.tabcash,
      tabcoins: +user.tabcoins,
      updated_at: user.updated_at.toISOString(),
      username: user.username,
    };
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
        status: 'published',
      });
      const lastEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${lastEvent.id}`);

      expect(response.status).toEqual(404);

      expect(responseBody).toEqual({
        name: 'NotFoundError',
        message: `O id "${lastEvent.id}" não foi encontrado no sistema.`,
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
      const firewallEvent = await orchestrator.getLastEvent();

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
            created_at: firewallEvent.created_at.toISOString(),
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

      expect(user3Response.status).toEqual(429);

      const firstFirewallEvent = await orchestrator.getLastEvent();

      const { response: user4Response } = await usersRequestBuilder.post({
        username: 'fourthUser',
        email: 'fourth-user@gmail.com',
        password: 'password',
      });

      expect(user4Response.status).toEqual(429);

      const secondFirewallEvent = await orchestrator.getLastEvent();

      expect(firstFirewallEvent.id).not.toEqual(secondFirewallEvent.id);

      // Get firewall side-effects
      const { response: firstFirewallResponse, responseBody: firstFirewallResponseBody } =
        await firewallRequestBuilder.get(`/${firstFirewallEvent.id}`);
      const { response: secondFirewallResponse, responseBody: secondFirewallResponseBody } =
        await firewallRequestBuilder.get(`/${secondFirewallEvent.id}`);

      expect(firstFirewallResponse.status).toEqual(200);
      expect(secondFirewallResponse.status).toEqual(200);

      await usersRequestBuilder.setUser(user1);
      const { responseBody: user1AfterFirewall } = await usersRequestBuilder.get(`/${user1.username}`);

      await usersRequestBuilder.setUser(user2);
      const { responseBody: user2AfterFirewall } = await usersRequestBuilder.get(`/${user2.username}`);

      expect(firstFirewallResponseBody).toEqual({
        affected: {
          users: [user1AfterFirewall, user2AfterFirewall],
        },
        events: [
          {
            created_at: firstFirewallEvent.created_at.toISOString(),
            id: firstFirewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: [user1AfterFirewall.id, user2AfterFirewall.id],
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
          {
            created_at: secondFirewallEvent.created_at.toISOString(),
            id: secondFirewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: [user1AfterFirewall.id, user2AfterFirewall.id],
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
        ],
      });

      expect(firstFirewallResponseBody).toEqual(secondFirewallResponseBody);
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

      expect(user3Response.status).toEqual(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toEqual('firewall:block_users');
      expect(firewallEvent.metadata.users).toEqual([user1.id, user2.id]);

      // Review firewall side-effect
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.setUser(firewallUser);
      const { response: reviewResponse } = await reviewFirewallRequestBuilder.post({ action: action });
      expect(reviewResponse.status).toEqual(200);

      // Get reviewed firewall event
      const reviewEvent = await orchestrator.getLastEvent();

      const { response, responseBody } = await firewallRequestBuilder.get(`/${firewallEvent.id}`);

      expect(response.status).toEqual(200);

      const user1AfterReview = await user.findOneById(user1.id, { withBalance: true });
      const user2AfterReview = await user.findOneById(user2.id, { withBalance: true });

      expect(responseBody).toEqual({
        affected: {
          users: [mapUserData(user1AfterReview), mapUserData(user2AfterReview)],
        },
        events: [
          {
            created_at: firewallEvent.created_at.toISOString(),
            id: firewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: [user1.id, user2.id],
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
          {
            created_at: reviewEvent.created_at.toISOString(),
            id: reviewEvent.id,
            metadata: {
              original_event_id: firewallEvent.id,
              users: [user1AfterReview.id, user2AfterReview.id],
            },
            originator_user_id: firewallUser.id,
            type: eventType,
          },
        ],
      });
    });

    test('With two consecutive "firewall:block_users" events from the same IP reviewed', async () => {
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

      expect(user3Response.status).toEqual(429);

      const firstFirewallEvent = await orchestrator.getLastEvent();

      const { response: user4Response } = await usersRequestBuilder.post({
        username: 'fourthUser',
        email: 'fourth-user@gmail.com',
        password: 'password',
      });

      expect(user4Response.status).toEqual(429);

      const secondFirewallEvent = await orchestrator.getLastEvent();

      expect(firstFirewallEvent.id).not.toEqual(secondFirewallEvent.id);

      // Check firewall side-effect
      expect(firstFirewallEvent.type).toEqual('firewall:block_users');
      expect(firstFirewallEvent.metadata.users).toEqual([user1.id, user2.id]);
      expect(secondFirewallEvent.type).toEqual(firstFirewallEvent.type);
      expect(secondFirewallEvent.metadata.users).toEqual(firstFirewallEvent.metadata.users);

      // Review firewall side-effect
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firstFirewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.setUser(firewallUser);
      const { response: reviewResponse } = await reviewFirewallRequestBuilder.post({ action: 'confirm' });
      expect(reviewResponse.status).toEqual(200);

      // Get reviewed firewall event from first event id
      const reviewEvent = await orchestrator.getLastEvent();

      const { response: responseFromFirstEvent, responseBody: responseBodyFromFirstEvent } =
        await firewallRequestBuilder.get(`/${firstFirewallEvent.id}`);

      expect(responseFromFirstEvent.status).toEqual(200);

      const user1AfterReview = await user.findOneById(user1.id, { withBalance: true });
      const user2AfterReview = await user.findOneById(user2.id, { withBalance: true });

      expect(responseBodyFromFirstEvent).toEqual({
        affected: {
          users: [mapUserData(user1AfterReview), mapUserData(user2AfterReview)],
        },
        events: [
          {
            created_at: firstFirewallEvent.created_at.toISOString(),
            id: firstFirewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: [user1.id, user2.id],
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
          {
            created_at: secondFirewallEvent.created_at.toISOString(),
            id: secondFirewallEvent.id,
            metadata: {
              from_rule: 'create:user',
              users: [user1.id, user2.id],
            },
            originator_user_id: null,
            type: 'firewall:block_users',
          },
          {
            created_at: reviewEvent.created_at.toISOString(),
            id: reviewEvent.id,
            metadata: {
              original_event_id: firstFirewallEvent.id,
              users: [user1AfterReview.id, user2AfterReview.id],
            },
            originator_user_id: firewallUser.id,
            type: 'moderation:block_users',
          },
        ],
      });

      // Get reviewed firewall event from second event id
      const { response: responseFromSecondEvent, responseBody: responseBodyFromSecondEvent } =
        await firewallRequestBuilder.get(`/${secondFirewallEvent.id}`);

      expect(responseFromSecondEvent.status).toEqual(200);

      expect(responseBodyFromSecondEvent).toEqual(responseBodyFromFirstEvent);
    });

    test('With a "firewall:block_contents:text_root" event', async () => {
      const usersRequestBuilder = new RequestBuilder(`/api/v1/users`);
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      await firewallRequestBuilder.buildUser({ with: ['read:firewall'] });

      // Create user and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toEqual(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

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
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const firewallRequestBuilder = new RequestBuilder(`/api/v1/events/firewall`);
      const firewallUser = await firewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      // Create users and contents
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const user1 = await contentsRequestBuilder.buildUser();

      const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
      const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
      const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

      expect(responseContent3.status).toEqual(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toEqual('firewall:block_contents:text_root');
      expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

      // Review firewall side-effect
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.setUser(firewallUser);
      const { response: reviewResponse } = await reviewFirewallRequestBuilder.post({ action: action });

      expect(reviewResponse.status).toEqual(200);

      // Get reviewed firewall event
      const reviewEvent = await orchestrator.getLastEvent();

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
            created_at: reviewEvent.created_at.toISOString(),
            id: reviewEvent.id,
            metadata: {
              contents: [content1AfterFirewall.id, content2AfterFirewall.id],
              original_event_id: firewallEvent.id,
            },
            originator_user_id: firewallUser.id,
            type: eventType,
          },
        ],
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

      expect(responseContent3.status).toEqual(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

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
              contents: [content1.id, content2.id],
            },
            originator_user_id: user1.id,
            type: 'firewall:block_contents:text_root',
          },
        ],
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

      expect(responseContent3.status).toEqual(429);

      // Get firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

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
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
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

      expect(responseContent3.status).toEqual(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toEqual('firewall:block_contents:text_child');
      expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

      // Review firewall side-effect
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.setUser(firewallUser);
      const { response: reviewResponse } = await reviewFirewallRequestBuilder.post({ action: action });

      expect(reviewResponse.status).toEqual(200);

      // Get reviewed firewall event
      const reviewEvent = await orchestrator.getLastEvent();

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
            created_at: reviewEvent.created_at.toISOString(),
            id: reviewEvent.id,
            metadata: {
              contents: [content1AfterFirewall.id, content2AfterFirewall.id],
              original_event_id: firewallEvent.id,
            },
            originator_user_id: firewallUser.id,
            type: eventType,
          },
        ],
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
        title: 'Root content',
        status: 'published',
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
      const firewallEvent = await orchestrator.getLastEvent();

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
  });
});
