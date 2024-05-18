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

describe('POST /api/v1/moderations/review_firewall/[id]', () => {
  async function createContentViaApi(contentsRequestBuilder, body) {
    return contentsRequestBuilder.post({
      title: `New content - ${new Date().getTime()}`,
      body: 'body',
      status: 'published',
      parent_id: body?.parent_id,
    });
  }

  describe('Anonymous user', () => {
    test('Reviewing a firewall side-effect', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect(response.status).toEqual(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "review:firewall".',
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
    test('Reviewing a firewall side-effect', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser();

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect(response.status).toEqual(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "review:firewall".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('User with "review:firewall" feature', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
      await orchestrator.createFirewallTestFunctions();
    });

    test('With a malformatted string as "id"', async () => {
      const reviewFirewallRequestBuilder = new RequestBuilder('/api/v1/moderations/review_firewall/random');
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'confirm',
      });

      expect(response.status).toEqual(400);

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

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Body containing an empty Object', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({});

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Objeto enviado deve ter no mínimo uma chave.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'object',
        type: 'object.min',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With an invalid "action"', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'review',
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"action" deve possuir um dos seguintes valores: "confirm", "undo".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'action',
        type: 'any.only',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With an "id" that does not exist', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: `O id "${eventId}" não foi encontrado no sistema.`,
        action: 'Verifique se o "id" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:NOT_FOUND',
        key: 'id',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With an "id" that is not a firewall event', async () => {
      const user = await orchestrator.createUser();

      await orchestrator.createContent({
        owner_id: user.id,
        title: 'Create event',
        status: 'published',
      });
      const lastEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${lastEvent.id}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando analisar um evento inválido.',
        action: 'Utilize um "id" que aponte para um evento de firewall.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:INVALID_EVENT_TYPE',
        key: 'type',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Review the same event twice', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');

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
      expect(firewallEvent.metadata.users).toStrictEqual([user1.id, user2.id]);

      // Review firewall
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response } = await reviewFirewallRequestBuilder.post({
        action: 'confirm',
      });

      expect(response.status).toEqual(200);

      // Review firewall again
      const { response: responseAgain, responseBody: responseAgainBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect(responseAgain.status).toEqual(400);

      expect(responseAgainBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando analisar um evento que já foi analisado.',
        action: 'Utilize um "id" que aponte para um evento de firewall que ainda não foi analisado.',
        status_code: 400,
        error_id: responseAgainBody.error_id,
        request_id: responseAgainBody.request_id,
        error_location_code: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:EVENT_ALREADY_REVIEWED',
        key: 'id',
      });
    });

    test('Review related events twice', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');

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
      const firewallEvent1 = await orchestrator.getLastEvent();

      const { response: user4Response } = await usersRequestBuilder.post({
        username: 'fourthUser',
        email: 'fourth-user@gmail.com',
        password: 'password',
      });
      const firewallEvent2 = await orchestrator.getLastEvent();

      expect(user3Response.status).toEqual(429);
      expect(user4Response.status).toEqual(429);

      // Check firewall side-effect
      expect(firewallEvent1.type).toEqual('firewall:block_users');
      expect(firewallEvent2.type).toEqual('firewall:block_users');

      expect(firewallEvent1.metadata.users).toStrictEqual([user1.id, user2.id]);

      // Review firewall
      const reviewFirstEventRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent1.id}`,
      );
      const firewallUser = await reviewFirstEventRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response } = await reviewFirstEventRequestBuilder.post({
        action: 'confirm',
      });

      expect(response.status).toEqual(200);

      // Review related event
      const reviewSecondEventRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent2.id}`,
      );
      await reviewSecondEventRequestBuilder.setUser(firewallUser);

      const { response: responseAgain, responseBody: responseAgainBody } = await reviewSecondEventRequestBuilder.post({
        action: 'undo',
      });

      expect(responseAgain.status).toEqual(400);

      expect(responseAgainBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando analisar um evento que já foi analisado.',
        action: 'Utilize um "id" que aponte para um evento de firewall que ainda não foi analisado.',
        status_code: 400,
        error_id: responseAgainBody.error_id,
        request_id: responseAgainBody.request_id,
        error_location_code: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:EVENT_ALREADY_REVIEWED',
        key: 'id',
      });
    });

    describe('With action = "undo"', () => {
      test('With a "firewall:block_users" event', async () => {
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');

        // Create users
        const ignoredUser = await orchestrator.createUser();

        const { responseBody: user1ResponseBody } = await usersRequestBuilder.post({
          username: 'firstUser',
          email: 'first-user@gmail.com',
          password: 'password',
        });
        await orchestrator.activateUser(user1ResponseBody);

        const user1 = await user.findOneById(user1ResponseBody.id, { withBalance: true });
        expect(user1.features).toStrictEqual([
          'create:session',
          'read:session',
          'create:content',
          'create:content:text_root',
          'create:content:text_child',
          'update:content',
          'update:user',
        ]);

        const { responseBody: user2ResponseBody } = await usersRequestBuilder.post({
          username: 'secondUser',
          email: 'second-user@gmail.com',
          password: 'password',
        });

        const user2 = await user.findOneById(user2ResponseBody.id, { withBalance: true });
        expect(user2.features).toStrictEqual(['read:activation_token']);

        const { response: user3Response } = await usersRequestBuilder.post({
          username: 'thirdUser',
          email: 'third-user@gmail.com',
          password: 'password',
        });

        expect(user3Response.status).toEqual(429);

        // Check firewall side-effect
        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent.type).toEqual('firewall:block_users');
        expect(firewallEvent.metadata.users).toStrictEqual([user1.id, user2.id]);

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: responseBody.affected.users[0].features,
                id: user1.id,
                tabcash: user1.tabcash,
                tabcoins: user1.tabcoins,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
              {
                created_at: user2.created_at.toISOString(),
                description: user2.description,
                features: responseBody.affected.users[1].features,
                id: user2.id,
                tabcash: user2.tabcash,
                tabcoins: user2.tabcoins,
                updated_at: user2.updated_at.toISOString(),
                username: user2.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                users: firewallEvent.metadata.users,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_users',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toEqual(NaN);

        const user1AfterUndoResponse = responseBody.affected.users[0];
        const user2AfterUndoResponse = responseBody.affected.users[1];

        expect(user1AfterUndoResponse.features.sort()).toStrictEqual(user1.features.sort());
        expect(user2AfterUndoResponse.features.sort()).toStrictEqual(user2.features.sort());

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: undoEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            users: firewallEvent.metadata.users,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:unblock_users',
        });

        expect(uuidVersion(undoEvent.id)).toEqual(4);

        // Check users
        const user1AfterUndo = await user.findOneById(user1.id, { withBalance: true });
        const user2AfterUndo = await user.findOneById(user2.id, { withBalance: true });
        const ignoredUserAfterUndo = await user.findOneById(ignoredUser.id, { withBalance: true });

        expect(ignoredUserAfterUndo).toStrictEqual(ignoredUser);

        expect(user1AfterUndo).toStrictEqual({
          ...user1,
          features: user1AfterUndo.features,
        });
        expect(user1AfterUndo.features.sort()).toStrictEqual(user1AfterUndoResponse.features.sort());

        expect(user2AfterUndo).toStrictEqual({
          ...user2,
          features: user2AfterUndo.features,
        });
        expect(user2AfterUndo.features.sort()).toStrictEqual(user2AfterUndoResponse.features.sort());
      });

      test('With a "firewall:block_users" event without "read:firewall" feature', async () => {
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');

        // Create users
        await usersRequestBuilder.post({
          username: 'firstUser',
          email: 'first-user@gmail.com',
          password: 'password',
        });

        await usersRequestBuilder.post({
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

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toEqual({});

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent.type).toEqual('moderation:unblock_users');
      });

      test('With a "firewall:block_contents:text_root" event', async () => {
        // Create user and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const ignoredUser = await orchestrator.createUser();
        let ignoredContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          title: 'Ignored content',
          status: 'published',
        });
        ignoredContent = await content.findOne({ where: { id: ignoredContent.id } });

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect(responseContent3.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent).not.toBeUndefined();
        expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1.body,
                created_at: content1.created_at,
                deleted_at: content1.deleted_at,
                id: content1.id,
                owner_id: content1.owner_id,
                parent_id: content1.parent_id,
                published_at: content1.published_at,
                slug: content1.slug,
                source_url: content1.source_url,
                status: content1.status,
                title: content1.title,
                updated_at: content1.updated_at,
              },
              {
                body: content2.body,
                created_at: content2.created_at,
                deleted_at: content2.deleted_at,
                id: content2.id,
                owner_id: content2.owner_id,
                parent_id: content2.parent_id,
                published_at: content2.published_at,
                slug: content2.slug,
                source_url: content2.source_url,
                status: content2.status,
                title: content2.title,
                updated_at: content2.updated_at,
              },
            ],
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: user1.features,
                id: user1.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_root',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toEqual(NaN);

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: undoEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            contents: firewallEvent.metadata.contents,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:unblock_contents:text_root',
        });

        expect(uuidVersion(undoEvent.id)).toEqual(4);

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });
        const ignoredContentAfterUndo = await content.findOne({ where: { id: ignoredContent.id } });

        expect(ignoredContentAfterUndo).toStrictEqual(ignoredContent);

        expect(content1AfterUndo).toStrictEqual({
          ...content1AfterSideEffect,
          status: 'published',
        });

        expect(content2AfterUndo).toStrictEqual({
          ...content2AfterSideEffect,
          status: 'published',
        });
      });

      test('With a "firewall:block_contents:text_root" event with TabCoins and a deleted content', async () => {
        // Create users and contents
        const ignoredUser = await orchestrator.createUser();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

        const user1 = await contentsRequestBuilder.buildUser();
        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);

        const user2 = await contentsRequestBuilder.buildUser();
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);

        await orchestrator.createRate(content1, 8);
        await orchestrator.createRate(content2, 15);

        const content1Deleted = await orchestrator.updateContent(content1.id, { status: 'deleted' });

        const user1AfterContentDeleted = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterContentDeleted.tabcoins).toEqual(0);

        const user2AfterRate = await user.findOneById(user2.id, { withBalance: true });
        expect(user2AfterRate.tabcoins).toEqual(15);

        await contentsRequestBuilder.setUser(user1);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect(responseContent3.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent).not.toBeUndefined();
        expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1Deleted.body,
                created_at: content1Deleted.created_at.toISOString(),
                deleted_at: content1Deleted.deleted_at.toISOString(),
                id: content1Deleted.id,
                owner_id: content1Deleted.owner_id,
                parent_id: content1Deleted.parent_id,
                published_at: content1Deleted.published_at.toISOString(),
                slug: content1Deleted.slug,
                source_url: content1Deleted.source_url,
                status: content1Deleted.status,
                title: content1Deleted.title,
                updated_at: content1Deleted.updated_at.toISOString(),
              },
              {
                body: content2.body,
                created_at: content2.created_at,
                deleted_at: content2.deleted_at,
                id: content2.id,
                owner_id: content2.owner_id,
                parent_id: content2.parent_id,
                published_at: content2.published_at,
                slug: content2.slug,
                source_url: content2.source_url,
                status: content2.status,
                title: content2.title,
                updated_at: content2.updated_at,
              },
            ],
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: user1.features,
                id: user1.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
              {
                created_at: user2AfterRate.created_at.toISOString(),
                description: user2AfterRate.description,
                features: user2AfterRate.features,
                id: user2AfterRate.id,
                tabcash: user2AfterRate.tabcash,
                tabcoins: user2AfterRate.tabcoins,
                updated_at: user2AfterRate.updated_at.toISOString(),
                username: user2AfterRate.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_root',
            },
          ],
        });

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: undoEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            contents: firewallEvent.metadata.contents,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:unblock_contents:text_root',
        });

        expect(uuidVersion(undoEvent.id)).toEqual(4);

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterUndo.status).toEqual('deleted');
        expect(content2AfterUndo.status).toEqual('published');

        // Check users
        const ignoredUserAfterUndo = await user.findOneById(ignoredUser.id, { withBalance: true });
        const user1AfterUndo = await user.findOneById(user1.id, { withBalance: true });
        const user2AfterUndo = await user.findOneById(user2.id, { withBalance: true });

        expect(ignoredUserAfterUndo).toStrictEqual(ignoredUser);
        expect(user1AfterUndo).toStrictEqual(user1AfterContentDeleted);
        expect(user2AfterUndo).toStrictEqual(user2AfterRate);
      });

      test('With three "firewall:block_contents:text_root" events for the same contents', async () => {
        // Create user and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);
        const firewallEvent1 = await orchestrator.getLastEvent();
        const { response: responseContent4 } = await createContentViaApi(contentsRequestBuilder);
        const firewallEvent2 = await orchestrator.getLastEvent();
        const { response: responseContent5 } = await createContentViaApi(contentsRequestBuilder);
        const firewallEvent3 = await orchestrator.getLastEvent();

        expect(responseContent3.status).toEqual(429);
        expect(responseContent4.status).toEqual(429);
        expect(responseContent5.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        expect(firewallEvent1.type).toEqual('firewall:block_contents:text_root');
        expect(firewallEvent2.type).toEqual('firewall:block_contents:text_root');
        expect(firewallEvent3.type).toEqual('firewall:block_contents:text_root');

        expect(firewallEvent1.metadata.contents).toStrictEqual([content1.id, content2.id]);

        expect(firewallEvent2).toEqual({
          ...firewallEvent1,
          id: firewallEvent2.id,
          created_at: firewallEvent2.created_at,
        });

        expect(firewallEvent3).toEqual({
          ...firewallEvent1,
          id: firewallEvent3.id,
          created_at: firewallEvent3.created_at,
        });

        expect(firewallEvent1.id).not.toEqual(firewallEvent2.id);
        expect(firewallEvent1.id).not.toEqual(firewallEvent3.id);
        expect(firewallEvent2.id).not.toEqual(firewallEvent3.id);

        // Undo firewall side-effect from second event
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent2.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1.body,
                created_at: content1.created_at,
                deleted_at: content1.deleted_at,
                id: content1.id,
                owner_id: content1.owner_id,
                parent_id: content1.parent_id,
                published_at: content1.published_at,
                slug: content1.slug,
                source_url: content1.source_url,
                status: content1.status,
                title: content1.title,
                updated_at: content1.updated_at,
              },
              {
                body: content2.body,
                created_at: content2.created_at,
                deleted_at: content2.deleted_at,
                id: content2.id,
                owner_id: content2.owner_id,
                parent_id: content2.parent_id,
                published_at: content2.published_at,
                slug: content2.slug,
                source_url: content2.source_url,
                status: content2.status,
                title: content2.title,
                updated_at: content2.updated_at,
              },
            ],
            users: [
              {
                created_at: defaultUser.created_at.toISOString(),
                description: defaultUser.description,
                features: defaultUser.features,
                id: defaultUser.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: defaultUser.updated_at.toISOString(),
                username: defaultUser.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent1.created_at.toISOString(),
              id: firewallEvent1.id,
              metadata: firewallEvent1.metadata,
              originator_user_id: firewallEvent1.originator_user_id,
              type: firewallEvent1.type,
            },
            {
              created_at: firewallEvent2.created_at.toISOString(),
              id: firewallEvent2.id,
              metadata: firewallEvent2.metadata,
              originator_user_id: firewallEvent2.originator_user_id,
              type: firewallEvent2.type,
            },
            {
              created_at: firewallEvent3.created_at.toISOString(),
              id: firewallEvent3.id,
              metadata: firewallEvent3.metadata,
              originator_user_id: firewallEvent3.originator_user_id,
              type: firewallEvent3.type,
            },
            {
              created_at: responseBody.events[3].created_at,
              id: responseBody.events[3].id,
              metadata: {
                original_event_id: firewallEvent2.id,
                contents: firewallEvent2.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_root',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toEqual(NaN);

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: undoEvent.id,
          metadata: {
            original_event_id: firewallEvent2.id,
            contents: firewallEvent2.metadata.contents,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:unblock_contents:text_root',
        });

        expect(uuidVersion(undoEvent.id)).toEqual(4);

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterUndo).toStrictEqual({
          ...content1AfterSideEffect,
          status: 'published',
        });

        expect(content2AfterUndo).toStrictEqual({
          ...content2AfterSideEffect,
          status: 'published',
        });
      });

      test('With a "firewall:block_contents:text_child" event', async () => {
        // Create user and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const ignoredUser = await orchestrator.createUser();
        let rootContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          title: 'Ignored content',
          status: 'published',
        });

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        rootContent = await content.findOne({ where: { id: rootContent.id } });

        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        expect(responseContent3.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent).not.toBeUndefined();
        expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1.body,
                created_at: content1.created_at,
                deleted_at: content1.deleted_at,
                id: content1.id,
                owner_id: content1.owner_id,
                parent_id: content1.parent_id,
                published_at: content1.published_at,
                slug: content1.slug,
                source_url: content1.source_url,
                status: content1.status,
                title: content1.title,
                updated_at: content1.updated_at,
              },
              {
                body: content2.body,
                created_at: content2.created_at,
                deleted_at: content2.deleted_at,
                id: content2.id,
                owner_id: content2.owner_id,
                parent_id: content2.parent_id,
                published_at: content2.published_at,
                slug: content2.slug,
                source_url: content2.source_url,
                status: content2.status,
                title: content2.title,
                updated_at: content2.updated_at,
              },
            ],
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: user1.features,
                id: user1.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_child',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toEqual(NaN);

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: undoEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            contents: firewallEvent.metadata.contents,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:unblock_contents:text_child',
        });

        expect(uuidVersion(undoEvent.id)).toEqual(4);

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });
        const rootContentAfterUndo = await content.findOne({ where: { id: rootContent.id } });

        expect(rootContentAfterUndo).toStrictEqual(rootContent);

        expect(content1AfterUndo).toStrictEqual({
          ...content1AfterSideEffect,
          status: 'published',
        });

        expect(content2AfterUndo).toStrictEqual({
          ...content2AfterSideEffect,
          status: 'published',
        });
      });

      test('With a "firewall:block_contents:text_child" event and a deleted content', async () => {
        // Create user and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const ignoredUser = await orchestrator.createUser();
        const rootContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          title: 'Ignored content',
          status: 'published',
        });

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        const content2Deleted = await content.update(content2.id, { status: 'deleted' });

        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        expect(responseContent3.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent).not.toBeUndefined();
        expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1.body,
                created_at: content1.created_at,
                deleted_at: content1.deleted_at,
                id: content1.id,
                owner_id: content1.owner_id,
                parent_id: content1.parent_id,
                published_at: content1.published_at,
                slug: content1.slug,
                source_url: content1.source_url,
                status: content1.status,
                title: content1.title,
                updated_at: content1.updated_at,
              },
              {
                body: content2Deleted.body,
                created_at: content2Deleted.created_at.toISOString(),
                deleted_at: content2Deleted.deleted_at.toISOString(),
                id: content2Deleted.id,
                owner_id: content2Deleted.owner_id,
                parent_id: content2Deleted.parent_id,
                published_at: content2Deleted.published_at.toISOString(),
                slug: content2Deleted.slug,
                source_url: content2Deleted.source_url,
                status: content2Deleted.status,
                title: content2Deleted.title,
                updated_at: content2Deleted.updated_at.toISOString(),
              },
            ],
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: user1.features,
                id: user1.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_child',
            },
          ],
        });

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: undoEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            contents: firewallEvent.metadata.contents,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:unblock_contents:text_child',
        });

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterUndo.status).toEqual('published');
        expect(content2AfterUndo.status).toEqual('deleted');
      });

      test('With a "firewall:block_contents:text_child" event and contents deleted before the firewall catch', async () => {
        // Create user and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const ignoredUser = await orchestrator.createUser();
        const rootContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          title: 'Ignored content',
          status: 'published',
        });

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        const content1Deleted = await content.update(content1.id, { status: 'deleted' });
        const content2Deleted = await content.update(content2.id, { status: 'deleted' });

        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        expect(responseContent3.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent).not.toBeUndefined();
        expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1Deleted.body,
                created_at: content1Deleted.created_at.toISOString(),
                deleted_at: content1Deleted.deleted_at.toISOString(),
                id: content1Deleted.id,
                owner_id: content1Deleted.owner_id,
                parent_id: content1Deleted.parent_id,
                published_at: content1Deleted.published_at.toISOString(),
                slug: content1Deleted.slug,
                source_url: content1Deleted.source_url,
                status: content1Deleted.status,
                title: content1Deleted.title,
                updated_at: content1Deleted.updated_at.toISOString(),
              },
              {
                body: content2Deleted.body,
                created_at: content2Deleted.created_at.toISOString(),
                deleted_at: content2Deleted.deleted_at.toISOString(),
                id: content2Deleted.id,
                owner_id: content2Deleted.owner_id,
                parent_id: content2Deleted.parent_id,
                published_at: content2Deleted.published_at.toISOString(),
                slug: content2Deleted.slug,
                source_url: content2Deleted.source_url,
                status: content2Deleted.status,
                title: content2Deleted.title,
                updated_at: content2Deleted.updated_at.toISOString(),
              },
            ],
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: user1.features,
                id: user1.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                contents: [content1.id, content2.id],
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_child',
            },
          ],
        });

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterUndo.status).toEqual('deleted');
        expect(content2AfterUndo.status).toEqual('deleted');
      });
    });

    describe('With action = "confirm"', () => {
      test('With a "firewall:block_users" event', async () => {
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');

        // Create users
        const ignoredUser = await orchestrator.createUser();

        const { responseBody: user1ResponseBody } = await usersRequestBuilder.post({
          username: 'firstUser',
          email: 'first-user@gmail.com',
          password: 'password',
        });
        await orchestrator.activateUser(user1ResponseBody);

        const user1 = await user.findOneById(user1ResponseBody.id, { withBalance: true });
        const user1FeaturesNotRemoved = [
          'create:content',
          'create:content:text_root',
          'create:content:text_child',
          'update:content',
          'update:user',
        ];
        expect(user1.features).toStrictEqual(['create:session', 'read:session', ...user1FeaturesNotRemoved]);

        const { responseBody: user2ResponseBody } = await usersRequestBuilder.post({
          username: 'secondUser',
          email: 'second-user@gmail.com',
          password: 'password',
        });

        const user2 = await user.findOneById(user2ResponseBody.id, { withBalance: true });
        expect(user2.features).toStrictEqual(['read:activation_token']);

        const { response: user3Response } = await usersRequestBuilder.post({
          username: 'thirdUser',
          email: 'third-user@gmail.com',
          password: 'password',
        });

        expect(user3Response.status).toEqual(429);

        // Check firewall side-effect
        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent.type).toEqual('firewall:block_users');
        expect(firewallEvent.metadata.users).toStrictEqual([user1ResponseBody.id, user2ResponseBody.id]);

        // Confirm firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'confirm',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            users: [
              {
                created_at: user1ResponseBody.created_at,
                description: user1ResponseBody.description,
                features: [...user1FeaturesNotRemoved, 'nuked'],
                id: user1ResponseBody.id,
                tabcash: user1ResponseBody.tabcash,
                tabcoins: user1ResponseBody.tabcoins,
                updated_at: user1.updated_at.toISOString(),
                username: user1ResponseBody.username,
              },
              {
                created_at: user2ResponseBody.created_at,
                description: user2ResponseBody.description,
                features: ['nuked'],
                id: user2ResponseBody.id,
                tabcash: user2ResponseBody.tabcash,
                tabcoins: user2ResponseBody.tabcoins,
                updated_at: user2.updated_at.toISOString(),
                username: user2ResponseBody.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                users: firewallEvent.metadata.users,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:block_users',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toEqual(NaN);

        // Check "confirm" event
        const confirmationEvent = await orchestrator.getLastEvent();
        expect(confirmationEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: confirmationEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            users: firewallEvent.metadata.users,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:block_users',
        });

        expect(uuidVersion(confirmationEvent.id)).toEqual(4);

        // Check users
        const user1AfterConfirm = await user.findOneById(user1ResponseBody.id, { withBalance: true });
        const user2AfterConfirm = await user.findOneById(user2ResponseBody.id, { withBalance: true });
        const ignoredUserAfterConfirm = await user.findOneById(ignoredUser.id, { withBalance: true });

        expect(ignoredUserAfterConfirm).toStrictEqual(ignoredUser);

        expect(user1AfterConfirm).toStrictEqual({
          ...user1,
          features: [...user1FeaturesNotRemoved, 'nuked'],
        });

        expect(user2AfterConfirm).toStrictEqual({
          ...user2,
          features: ['nuked'],
        });
      });

      test('With a "firewall:block_contents:text_root" event with TabCoins', async () => {
        // Create users and contents
        const ignoredUser = await orchestrator.createUser();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

        const user1 = await contentsRequestBuilder.buildUser();
        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);

        const user2 = await contentsRequestBuilder.buildUser();
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);

        await orchestrator.createRate(content1, 8);
        await orchestrator.createRate(content2, 15);

        const user1AfterRate = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterRate.tabcoins).toEqual(8);

        const user2AfterRate = await user.findOneById(user2.id, { withBalance: true });
        expect(user2AfterRate.tabcoins).toEqual(15);

        await contentsRequestBuilder.setUser(user1);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect(responseContent3.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent).not.toBeUndefined();
        expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

        // Confirm firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'confirm',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1.body,
                created_at: content1.created_at,
                deleted_at: responseBody.affected.contents[0].deleted_at,
                id: content1.id,
                owner_id: content1.owner_id,
                parent_id: content1.parent_id,
                published_at: content1.published_at,
                slug: content1.slug,
                source_url: content1.source_url,
                status: 'deleted',
                title: content1.title,
                updated_at: content1.updated_at,
              },
              {
                body: content2.body,
                created_at: content2.created_at,
                deleted_at: responseBody.affected.contents[1].deleted_at,
                id: content2.id,
                owner_id: content2.owner_id,
                parent_id: content2.parent_id,
                published_at: content2.published_at,
                slug: content2.slug,
                source_url: content2.source_url,
                status: 'deleted',
                title: content2.title,
                updated_at: content2.updated_at,
              },
            ],
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: user1.features,
                id: user1.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
              {
                created_at: user2.created_at.toISOString(),
                description: user2.description,
                features: user2.features,
                id: user2.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user2.updated_at.toISOString(),
                username: user2.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:block_contents:text_root',
            },
          ],
        });

        // Check "confirm" event
        const confirmationEvent = await orchestrator.getLastEvent();
        expect(confirmationEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: confirmationEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            contents: firewallEvent.metadata.contents,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:block_contents:text_root',
        });

        expect(uuidVersion(confirmationEvent.id)).toEqual(4);

        // Check contents
        const content1AfterConfirm = await content.findOne({ where: { id: content1.id } });
        const content2AfterConfirm = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterConfirm.deleted_at.toISOString()).toEqual(responseBody.affected.contents[0].deleted_at);
        expect(content1AfterConfirm.status).toEqual('deleted');

        expect(content2AfterConfirm.deleted_at.toISOString()).toEqual(responseBody.affected.contents[1].deleted_at);
        expect(content2AfterConfirm.status).toEqual('deleted');

        // Check users
        const ignoredUserAfterConfirm = await user.findOneById(ignoredUser.id, { withBalance: true });
        const user1AfterConfirm = await user.findOneById(user1.id, { withBalance: true });
        const user2AfterConfirm = await user.findOneById(user2.id, { withBalance: true });

        expect(ignoredUserAfterConfirm).toStrictEqual(ignoredUser);
        expect(user1AfterConfirm).toStrictEqual({
          ...user1,
          tabcoins: 0,
          tabcash: 0,
        });
        expect(user2AfterConfirm).toStrictEqual({
          ...user2,
          tabcoins: 0,
          tabcash: 0,
        });
      });

      test('With a "firewall:block_contents:text_child" event with a deleted content', async () => {
        // Create user and contents
        const ignoredUser = await orchestrator.createUser();
        let rootContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          title: 'Ignored content',
          status: 'published',
        });

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        const content1Deleted = await orchestrator.updateContent(content1.id, { status: 'deleted' });

        rootContent = await content.findOne({ where: { id: rootContent.id } });

        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        expect(responseContent3.status).toEqual(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toEqual('firewall');
        expect(content2AfterSideEffect.status).toEqual('firewall');

        const firewallEvent = await orchestrator.getLastEvent();

        expect(firewallEvent).not.toBeUndefined();
        expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

        // Confirm firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'confirm',
        });

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              {
                body: content1Deleted.body,
                created_at: content1Deleted.created_at.toISOString(),
                deleted_at: content1Deleted.deleted_at.toISOString(),
                id: content1Deleted.id,
                owner_id: content1Deleted.owner_id,
                parent_id: content1Deleted.parent_id,
                published_at: content1Deleted.published_at.toISOString(),
                slug: content1Deleted.slug,
                source_url: content1Deleted.source_url,
                status: content1Deleted.status,
                title: content1Deleted.title,
                updated_at: content1Deleted.updated_at.toISOString(),
              },
              {
                body: content2.body,
                created_at: content2.created_at,
                deleted_at: responseBody.affected.contents[1].deleted_at,
                id: content2.id,
                owner_id: content2.owner_id,
                parent_id: content2.parent_id,
                published_at: content2.published_at,
                slug: content2.slug,
                source_url: content2.source_url,
                status: 'deleted',
                title: content2.title,
                updated_at: content2.updated_at,
              },
            ],
            users: [
              {
                created_at: user1.created_at.toISOString(),
                description: user1.description,
                features: user1.features,
                id: user1.id,
                tabcash: 0,
                tabcoins: 0,
                updated_at: user1.updated_at.toISOString(),
                username: user1.username,
              },
            ],
          },
          events: [
            {
              created_at: firewallEvent.created_at.toISOString(),
              id: firewallEvent.id,
              metadata: firewallEvent.metadata,
              originator_user_id: firewallEvent.originator_user_id,
              type: firewallEvent.type,
            },
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                original_event_id: firewallEvent.id,
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:block_contents:text_child',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toEqual(NaN);

        // Check "confirm" event
        const confirmationEvent = await orchestrator.getLastEvent();
        expect(confirmationEvent).toStrictEqual({
          created_at: expect.any(Date),
          id: confirmationEvent.id,
          metadata: {
            original_event_id: firewallEvent.id,
            contents: firewallEvent.metadata.contents,
          },
          originator_ip: '127.0.0.1',
          originator_user_id: firewallUser.id,
          type: 'moderation:block_contents:text_child',
        });

        expect(uuidVersion(confirmationEvent.id)).toEqual(4);

        // Check contents
        const content1AfterConfirm = await content.findOne({ where: { id: content1.id } });
        const content2AfterConfirm = await content.findOne({ where: { id: content2.id } });
        const rootContentAfterConfirm = await content.findOne({ where: { id: rootContent.id } });

        expect(rootContentAfterConfirm).toStrictEqual({
          ...rootContent,
          children_deep_count: '0',
        });

        expect(content1AfterConfirm.deleted_at).toEqual(content1Deleted.deleted_at);
        expect(content1AfterConfirm.status).toEqual('deleted');

        expect(content2AfterConfirm.deleted_at).toEqual(new Date(responseBody.affected.contents[1].deleted_at));
        expect(content2AfterConfirm.status).toEqual('deleted');
      });
    });
  });
});
