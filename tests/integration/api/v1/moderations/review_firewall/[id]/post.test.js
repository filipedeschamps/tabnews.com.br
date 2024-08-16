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
    return await contentsRequestBuilder.post({
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

      expect.soft(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "review:firewall".',
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
    test('Reviewing a firewall side-effect', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser();

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect.soft(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "review:firewall".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
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

    test('Body containing an empty Object', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({});

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"action" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'action',
        type: 'any.required',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an invalid "action"', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'review',
      });

      expect.soft(response.status).toBe(400);

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

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an "id" that does not exist', async () => {
      const eventId = randomUUID();
      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${eventId}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect.soft(response.status).toBe(404);

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

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an "id" that is not a firewall event', async () => {
      const user = await orchestrator.createUser();

      await orchestrator.createContent({
        owner_id: user.id,
        status: 'published',
        title: 'Create event',
      });
      const lastEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall/${lastEvent.id}`);
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response, responseBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect.soft(response.status).toBe(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: `O id "${lastEvent.id}" não foi encontrado no sistema.`,
        action: 'Verifique se o "id" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:VALIDATE_AND_GET_FIREWALL_EVENT_TO_REVIEW:NOT_FOUND',
        key: 'id',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
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

      expect.soft(user3Response.status).toBe(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toBe('firewall:block_users');
      expect(firewallEvent.metadata.users).toStrictEqual([user1.id, user2.id]);

      // Review firewall
      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response } = await reviewFirewallRequestBuilder.post({
        action: 'confirm',
      });

      expect.soft(response.status).toBe(200);

      // Review firewall again
      const { response: responseAgain, responseBody: responseAgainBody } = await reviewFirewallRequestBuilder.post({
        action: 'undo',
      });

      expect.soft(responseAgain.status).toBe(400);

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

      expect.soft(user3Response.status).toBe(429);
      expect.soft(user4Response.status).toBe(429);

      // Check firewall side-effect
      expect(firewallEvent1.type).toBe('firewall:block_users');
      expect(firewallEvent2.type).toBe('firewall:block_users');

      expect(firewallEvent1.metadata.users).toStrictEqual([user1.id, user2.id]);

      // Review firewall
      const reviewEventRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall`);
      await reviewEventRequestBuilder.buildUser({ with: ['review:firewall'] });

      const { response } = await reviewEventRequestBuilder.post(`/${firewallEvent1.id}`, {
        action: 'confirm',
      });

      expect.soft(response.status).toBe(200);

      // Review related event
      const { response: responseAgain, responseBody: responseAgainBody } = await reviewEventRequestBuilder.post(
        `/${firewallEvent2.id}`,
        { action: 'undo' },
      );

      expect.soft(responseAgain.status).toBe(400);

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

        expect.soft(user3Response.status).toBe(429);

        // Check firewall side-effect
        const firewallEvent = await orchestrator.getLastEvent();
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

        expect.soft(response.status).toBe(200);

        expect.soft(user1.features).toStrictEqual(expect.arrayContaining(responseBody.affected.users[0].features));
        expect.soft(user2.features).toStrictEqual(expect.arrayContaining(responseBody.affected.users[1].features));
        expect(responseBody).toStrictEqual({
          affected: {
            users: [
              mapUserData({ ...user1, features: expect.arrayContaining(user1.features) }),
              mapUserData({ ...user2, features: expect.arrayContaining(user2.features) }),
            ],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                users: firewallEvent.metadata.users,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_users',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toBeNaN();
        expect(uuidVersion(createdEventResponse.id)).toBe(4);

        // Check users
        const user1AfterUndo = await user.findOneById(user1.id, { withBalance: true });
        const user2AfterUndo = await user.findOneById(user2.id, { withBalance: true });
        const ignoredUserAfterUndo = await user.findOneById(ignoredUser.id, { withBalance: true });

        expect(ignoredUserAfterUndo).toStrictEqual(ignoredUser);

        expect(user1AfterUndo).toStrictEqual({
          ...user1,
          features: responseBody.affected.users[0].features,
        });

        expect(user2AfterUndo).toStrictEqual({
          ...user2,
          features: responseBody.affected.users[1].features,
        });
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

        expect.soft(user3Response.status).toBe(429);

        // Check firewall side-effect
        const firewallEvent = await orchestrator.getLastEvent();
        expect(firewallEvent.type).toBe('firewall:block_users');

        // Undo firewall side-effect
        const reviewFirewallRequestBuilder = new RequestBuilder(
          `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
        );
        await reviewFirewallRequestBuilder.buildUser({ with: ['review:firewall'] });

        const { response, responseBody } = await reviewFirewallRequestBuilder.post({
          action: 'undo',
        });

        expect.soft(response.status).toBe(200);

        expect(responseBody).toStrictEqual({});

        // Check "undo" event
        const undoEvent = await orchestrator.getLastEvent();
        expect(undoEvent.type).toBe('moderation:unblock_users');
      });

      test('With a "firewall:block_contents:text_root" event', async () => {
        // Create user and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const ignoredUser = await orchestrator.createUser();
        let ignoredContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          status: 'published',
          title: 'Ignored content',
        });
        ignoredContent = await content.findOne({ where: { id: ignoredContent.id } });

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        const expectedAffectedContents = [mapContentData(content1), mapContentData(content2)];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData(user1)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_root',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toBeNaN();
        expect(uuidVersion(createdEventResponse.id)).toBe(4);

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
        expect(user1AfterContentDeleted.tabcoins).toBe(0);

        const user2AfterRate = await user.findOneById(user2.id, { withBalance: true });
        expect(user2AfterRate.tabcoins).toBe(15);

        await contentsRequestBuilder.setUser(user1);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        expect.soft(response.status).toBe(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              mapContentData(content1Deleted),
              mapContentData({ ...content2, tabcoins: 15, tabcoins_credit: 15 }),
            ],
            users: [mapUserData(user1), mapUserData(user2AfterRate)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_root',
            },
          ],
        });

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterUndo.status).toBe('deleted');
        expect(content2AfterUndo.status).toBe('published');

        // Check users
        const ignoredUserAfterUndo = await user.findOneById(ignoredUser.id, { withBalance: true });
        const user1AfterUndo = await user.findOneById(user1.id, { withBalance: true });
        const user2AfterUndo = await user.findOneById(user2.id, { withBalance: true });

        expect(ignoredUserAfterUndo).toStrictEqual(ignoredUser);
        expect(user1AfterUndo).toStrictEqual(user1AfterContentDeleted);
        expect(user2AfterUndo).toStrictEqual(user2AfterRate);
      });

      test('With a "firewall:block_contents:text_root" event with a content with negative TabCoins', async () => {
        // Create users and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

        const user1 = await contentsRequestBuilder.buildUser();
        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);

        await orchestrator.createRate(content2, 1);
        await orchestrator.createRate(content2, -3);

        const user1AfterRate = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterRate.tabcoins).toBe(-2);

        await contentsRequestBuilder.setUser(user1);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        const expectedAffectedContents = [
          mapContentData(content1),
          mapContentData({ ...content2, tabcoins: -2, tabcoins_credit: 1, tabcoins_debit: -3 }),
        ];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData(user1AfterRate)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_root',
            },
          ],
        });

        // Check users
        const user1AfterUndo = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterUndo).toStrictEqual(user1AfterRate);
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

        expect.soft(responseContent3.status).toBe(429);
        expect.soft(responseContent4.status).toBe(429);
        expect.soft(responseContent5.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        expect(firewallEvent1.type).toBe('firewall:block_contents:text_root');
        expect(firewallEvent2.type).toBe('firewall:block_contents:text_root');
        expect(firewallEvent3.type).toBe('firewall:block_contents:text_root');

        expect(firewallEvent1.metadata.contents).toStrictEqual([content1.id, content2.id]);

        expect(firewallEvent2).toStrictEqual({
          ...firewallEvent1,
          id: firewallEvent2.id,
          created_at: firewallEvent2.created_at,
        });

        expect(firewallEvent3).toStrictEqual({
          ...firewallEvent1,
          id: firewallEvent3.id,
          created_at: firewallEvent3.created_at,
        });

        expect(firewallEvent1.id).not.toBe(firewallEvent2.id);
        expect(firewallEvent1.id).not.toBe(firewallEvent3.id);
        expect(firewallEvent2.id).not.toBe(firewallEvent3.id);

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

        const expectedAffectedContents = [mapContentData(content1), mapContentData(content2)];
        const expectedRelatedEvents = [firewallEvent1.id, firewallEvent2.id, firewallEvent3.id];
        const expectedEvents = [
          mapFirewallEventData(firewallEvent1),
          mapFirewallEventData(firewallEvent2),
          mapFirewallEventData(firewallEvent3),
          {
            created_at: responseBody.events[3].created_at,
            id: responseBody.events[3].id,
            metadata: {
              related_events: expect.arrayContaining(expectedRelatedEvents),
              contents: [content1.id, content2.id],
            },
            originator_user_id: firewallUser.id,
            type: 'moderation:unblock_contents:text_root',
          },
        ];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect.soft(expectedEvents).toStrictEqual(expect.arrayContaining(responseBody.events));
        expect
          .soft(expectedRelatedEvents)
          .toStrictEqual(expect.arrayContaining(responseBody.events[3].metadata.related_events));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData(defaultUser)],
          },
          events: expect.arrayContaining(expectedEvents),
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toBeNaN();

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
          status: 'published',
          title: 'Ignored content',
        });

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: content1.id,
        });

        await orchestrator.createContent({
          body: 'Ignored child content',
          owner_id: ignoredUser.id,
          status: 'published',
          parent_id: content1.id,
        });

        rootContent = await content.findOne({ where: { id: rootContent.id } });

        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        const expectedAffectedContents = [
          mapContentData({ ...content1, children_deep_count: 2 }),
          mapContentData(content2),
        ];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData(user1)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_child',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toBeNaN();
        expect(uuidVersion(createdEventResponse.id)).toBe(4);

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });
        const rootContentAfterUndo = await content.findOne({ where: { id: rootContent.id } });

        expect(rootContentAfterUndo).toStrictEqual(rootContent);

        expect(content1AfterUndo).toStrictEqual({
          ...content1AfterSideEffect,
          children_deep_count: '2',
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
          status: 'published',
          title: 'Ignored content',
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

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        const expectedAffectedContents = [mapContentData(content1), mapContentData(content2Deleted)];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData(user1)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:unblock_contents:text_child',
            },
          ],
        });

        // Check contents
        const content1AfterUndo = await content.findOne({ where: { id: content1.id } });
        const content2AfterUndo = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterUndo.status).toBe('published');
        expect(content2AfterUndo.status).toBe('deleted');
      });

      test('With a "firewall:block_contents:text_child" event and contents deleted before the firewall catch', async () => {
        // Create user and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const ignoredUser = await orchestrator.createUser();
        const rootContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          status: 'published',
          title: 'Ignored content',
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

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        const expectedAffectedContents = [
          mapContentData({ ...content1Deleted, owner_username: user1.username }),
          mapContentData({ ...content2Deleted, owner_username: user1.username }),
        ];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData(user1)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
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

        expect(content1AfterUndo.status).toBe('deleted');
        expect(content2AfterUndo.status).toBe('deleted');
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

        expect.soft(user3Response.status).toBe(429);

        // Check firewall side-effect
        const firewallEvent = await orchestrator.getLastEvent();
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

        expect.soft(response.status).toBe(200);

        expect(responseBody).toStrictEqual({
          affected: {
            users: [
              mapUserData({
                ...user1ResponseBody,
                features: [...user1FeaturesNotRemoved, 'nuked'],
                updated_at: user1.updated_at.toISOString(),
              }),
              mapUserData({
                ...user2ResponseBody,
                features: ['nuked'],
                updated_at: user2.updated_at.toISOString(),
              }),
            ],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                users: firewallEvent.metadata.users,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:block_users',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toBeNaN();
        expect(uuidVersion(createdEventResponse.id)).toBe(4);

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
        expect(user1AfterRate.tabcoins).toBe(8);

        const user2AfterRate = await user.findOneById(user2.id, { withBalance: true });
        expect(user2AfterRate.tabcoins).toBe(15);

        await contentsRequestBuilder.setUser(user1);
        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        expect.soft(response.status).toBe(200);

        expect(responseBody).toStrictEqual({
          affected: {
            contents: [
              mapContentData({
                ...content1,
                deleted_at: responseBody.affected.contents[0].deleted_at,
                owner_username: user1.username,
                status: 'deleted',
                tabcoins: 8,
                tabcoins_credit: 8,
              }),
              mapContentData({
                ...content2,
                deleted_at: responseBody.affected.contents[1].deleted_at,
                owner_username: user2.username,
                status: 'deleted',
                tabcoins: 15,
                tabcoins_credit: 15,
              }),
            ],
            users: [mapUserData(user1), mapUserData(user2)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:block_contents:text_root',
            },
          ],
        });

        // Check contents
        const content1AfterConfirm = await content.findOne({ where: { id: content1.id } });
        const content2AfterConfirm = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterConfirm.deleted_at.toISOString()).toBe(responseBody.affected.contents[0].deleted_at);
        expect(content1AfterConfirm.status).toBe('deleted');

        expect(content2AfterConfirm.deleted_at.toISOString()).toBe(responseBody.affected.contents[1].deleted_at);
        expect(content2AfterConfirm.status).toBe('deleted');

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

      test('With a "firewall:block_contents:text_root" event with a content with negative TabCoins', async () => {
        // Create users and contents
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

        const user1 = await contentsRequestBuilder.buildUser();
        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);

        await orchestrator.createRate(content1, -4);
        await orchestrator.createRate(content1, 1);
        await orchestrator.createRate(content2, 1);

        const user1AfterRate = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterRate.tabcoins).toBe(-2);

        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder);

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        const expectedAffectedContents = [
          mapContentData({
            ...content1,
            deleted_at: responseBody.affected.contents[0].deleted_at,
            owner_username: user1.username,
            status: 'deleted',
            tabcoins: -3,
            tabcoins_credit: 1,
            tabcoins_debit: -4,
          }),
          mapContentData({
            ...content2,
            deleted_at: responseBody.affected.contents[1].deleted_at,
            owner_username: user1.username,
            status: 'deleted',
            tabcoins: 1,
            tabcoins_credit: 1,
          }),
        ];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData({ ...user1, tabcoins: -3 })],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:block_contents:text_root',
            },
          ],
        });

        // Check users
        const user1AfterConfirm = await user.findOneById(user1.id, { withBalance: true });
        expect(user1AfterConfirm).toStrictEqual({
          ...user1,
          tabcoins: -3,
          tabcash: 0,
        });
      });

      test('With a "firewall:block_contents:text_child" event with a deleted content', async () => {
        // Create user and contents
        const ignoredUser = await orchestrator.createUser();
        let rootContent = await orchestrator.createContent({
          owner_id: ignoredUser.id,
          status: 'published',
          title: 'Ignored content',
        });

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const { responseBody: content1 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });
        const { responseBody: content2 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: content1.id,
        });

        await orchestrator.createContent({
          body: 'Ignored child content',
          owner_id: ignoredUser.id,
          status: 'published',
          parent_id: content1.id,
        });

        const content1Deleted = await orchestrator.updateContent(content1.id, { status: 'deleted' });

        rootContent = await content.findOne({ where: { id: rootContent.id } });

        const { response: responseContent3 } = await createContentViaApi(contentsRequestBuilder, {
          parent_id: rootContent.id,
        });

        expect.soft(responseContent3.status).toBe(429);

        // Check firewall side-effect
        const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
        const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

        expect(content1AfterSideEffect.status).toBe('firewall');
        expect(content2AfterSideEffect.status).toBe('firewall');

        const firewallEvent = await orchestrator.getLastEvent();
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

        const expectedAffectedContents = [
          mapContentData({ ...content1Deleted, children_deep_count: 1, owner_username: user1.username }),
          mapContentData({
            ...content2,
            deleted_at: expect.any(String),
            owner_username: user1.username,
            status: 'deleted',
          }),
        ];

        expect.soft(response.status).toBe(200);

        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBody.affected.contents));
        expect(responseBody).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: [mapUserData(user1)],
          },
          events: [
            mapFirewallEventData(firewallEvent),
            {
              created_at: responseBody.events[1].created_at,
              id: responseBody.events[1].id,
              metadata: {
                related_events: [firewallEvent.id],
                contents: firewallEvent.metadata.contents,
              },
              originator_user_id: firewallUser.id,
              type: 'moderation:block_contents:text_child',
            },
          ],
        });

        const createdEventResponse = responseBody.events[1];
        expect(Date.parse(createdEventResponse.created_at)).not.toBeNaN();
        expect(uuidVersion(createdEventResponse.id)).toBe(4);

        // Check contents
        const content1AfterConfirm = await content.findOne({ where: { id: content1.id } });
        const content2AfterConfirm = await content.findOne({ where: { id: content2.id } });
        const rootContentAfterConfirm = await content.findOne({ where: { id: rootContent.id } });

        expect(rootContentAfterConfirm).toStrictEqual({
          ...rootContent,
          children_deep_count: '1',
        });

        expect(content1AfterConfirm.deleted_at.toISOString()).toBe(content1Deleted.deleted_at.toISOString());
        expect(content1AfterConfirm.status).toBe('deleted');

        const responseContent2 = responseBody.affected.contents.find((c) => c.id === content2.id);
        expect(content2AfterConfirm.deleted_at.toISOString()).toBe(responseContent2.deleted_at);
        expect(content2AfterConfirm.status).toBe('deleted');
      });
    });

    describe('Different firewall events containing an element in common', () => {
      test('Confirm with two "firewall:block_users" events', async () => {
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const { response: response1, responseBody: user1 } = await usersRequestBuilder.post({
          username: 'request1',
          email: 'request1@gmail.com',
          password: 'password',
        });

        const createUserEvent1 = await orchestrator.getLastEvent();

        const { response: response2, responseBody: user2 } = await usersRequestBuilder.post({
          username: 'request2',
          email: 'request2@gmail.com',
          password: 'password',
        });

        const { response: response3 } = await usersRequestBuilder.post({
          username: 'request3',
          email: 'request3@gmail.com',
          password: 'password',
        });

        const firewallEvent1 = await orchestrator.getLastEvent();

        await orchestrator.updateEventCreatedAt(createUserEvent1.id, new Date(Date.now() - 1000 * 60 * 30));

        const { response: response4, responseBody: user4 } = await usersRequestBuilder.post({
          username: 'request4',
          email: 'request4@gmail.com',
          password: 'password',
        });

        const { response: response5 } = await usersRequestBuilder.post({
          username: 'request5',
          email: 'request5@gmail.com',
          password: 'password',
        });

        const firewallEvent2 = await orchestrator.getLastEvent();

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);
        expect.soft(response3.status).toBe(429);
        expect.soft(response4.status).toBe(201);
        expect.soft(response5.status).toBe(429);

        expect(firewallEvent1.type).toBe('firewall:block_users');
        expect(firewallEvent2.type).toBe('firewall:block_users');

        // Confirm first event
        const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall`);
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response: responseConfirm, responseBody: responseBodyConfirm } =
          await reviewFirewallRequestBuilder.post(`/${firewallEvent1.id}`, {
            action: 'confirm',
          });

        const expectedAffectedUsers = [
          mapUserData({ ...user1, features: ['nuked'] }),
          mapUserData({ ...user2, features: ['nuked'] }),
          mapUserData({ ...user4, features: ['nuked'] }),
        ];
        const expectedMetadataUsers = [user1.id, user2.id, user4.id];
        const expectedRelatedEvents = [firewallEvent1.id, firewallEvent2.id];
        const expectedEvents = [
          mapFirewallEventData(firewallEvent1),
          mapFirewallEventData(firewallEvent2),
          {
            created_at: responseBodyConfirm.events[2].created_at,
            id: responseBodyConfirm.events[2].id,
            metadata: {
              related_events: expect.arrayContaining(expectedRelatedEvents),
              users: expect.arrayContaining(expectedMetadataUsers),
            },
            originator_user_id: firewallUser.id,
            type: 'moderation:block_users',
          },
        ];

        expect.soft(responseConfirm.status).toBe(200);

        expect.soft(expectedEvents).toStrictEqual(expect.arrayContaining(responseBodyConfirm.events));
        expect.soft(expectedAffectedUsers).toStrictEqual(expect.arrayContaining(responseBodyConfirm.affected.users));
        expect
          .soft(expectedMetadataUsers)
          .toStrictEqual(expect.arrayContaining(responseBodyConfirm.events[2].metadata.users));
        expect
          .soft(expectedRelatedEvents)
          .toStrictEqual(expect.arrayContaining(responseBodyConfirm.events[2].metadata.related_events));
        expect(responseBodyConfirm).toStrictEqual({
          affected: {
            users: expect.arrayContaining(expectedAffectedUsers),
          },
          events: expect.arrayContaining(expectedEvents),
        });

        const createdConfirmationEventResponse = responseBodyConfirm.events[1];
        expect(Date.parse(createdConfirmationEventResponse.created_at)).not.toBeNaN();
        expect(uuidVersion(createdConfirmationEventResponse.id)).toBe(4);

        // Get second event
        const getFirewallEventRequestBuilder = new RequestBuilder('/api/v1/events/firewall');
        await getFirewallEventRequestBuilder.buildUser({ with: ['read:firewall'] });

        const { response: responseFirewall2, responseBody: responseBodyFirewall2 } =
          await getFirewallEventRequestBuilder.get(`/${firewallEvent2.id}`);

        expect.soft(responseFirewall2.status).toBe(200);

        expect(responseBodyFirewall2).toStrictEqual({
          affected: {
            users: expect.arrayContaining(expectedAffectedUsers),
          },
          events: expect.arrayContaining(expectedEvents),
        });
      });

      test('Undo two "firewall:block_contents:text_root" events', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const user1 = await contentsRequestBuilder.buildUser();

        const { response: response1, responseBody: content1 } = await createContentViaApi(contentsRequestBuilder);
        const createContentEvent1 = await orchestrator.getLastEvent();

        const { response: response2, responseBody: content2 } = await createContentViaApi(contentsRequestBuilder);
        await orchestrator.createRate(content2, 10);

        const { response: response3 } = await createContentViaApi(contentsRequestBuilder);

        const firewallEvent1 = await orchestrator.getLastEvent();

        await orchestrator.updateEventCreatedAt(createContentEvent1.id, new Date(Date.now() - 30 * 60 * 1000));

        const { response: response4, responseBody: content4 } = await createContentViaApi(contentsRequestBuilder);
        await orchestrator.createRate(content4, 2);

        const { response: response5 } = await createContentViaApi(contentsRequestBuilder);

        const firewallEvent2 = await orchestrator.getLastEvent();

        expect.soft(response1.status).toBe(201);
        expect.soft(response2.status).toBe(201);
        expect.soft(response3.status).toBe(429);
        expect.soft(response4.status).toBe(201);
        expect.soft(response5.status).toBe(429);

        // Undo second event
        const reviewFirewallRequestBuilder = new RequestBuilder(`/api/v1/moderations/review_firewall`);
        const firewallUser = await reviewFirewallRequestBuilder.buildUser({
          with: ['read:firewall', 'review:firewall'],
        });

        const { response: responseConfirm, responseBody: responseBodyUndo } = await reviewFirewallRequestBuilder.post(
          `/${firewallEvent2.id}`,
          { action: 'undo' },
        );

        const expectedAffectedContents = [
          mapContentData({ ...content1, owner_username: user1.username }),
          mapContentData({ ...content2, tabcoins: 10, tabcoins_credit: 10 }),
          mapContentData({ ...content4, owner_username: user1.username, tabcoins: 2, tabcoins_credit: 2 }),
        ];
        const expectedAffectedUsers = [
          mapUserData({ ...user1, features: expect.arrayContaining(user1.features), tabcoins: 12 }),
        ];
        const expectedMetadataContents = [content1.id, content2.id, content4.id];
        const expectedRelatedEvents = [firewallEvent1.id, firewallEvent2.id];
        const expectedEvents = [
          mapFirewallEventData(firewallEvent1),
          mapFirewallEventData(firewallEvent2),
          {
            created_at: responseBodyUndo.events[2].created_at,
            id: responseBodyUndo.events[2].id,
            metadata: {
              related_events: expect.arrayContaining(expectedRelatedEvents),
              contents: expect.arrayContaining(expectedMetadataContents),
            },
            originator_user_id: firewallUser.id,
            type: 'moderation:unblock_contents:text_root',
          },
        ];

        expect.soft(responseConfirm.status).toBe(200);

        expect.soft(expectedEvents).toStrictEqual(expect.arrayContaining(responseBodyUndo.events));
        expect.soft(expectedAffectedContents).toStrictEqual(expect.arrayContaining(responseBodyUndo.affected.contents));
        expect
          .soft(expectedRelatedEvents)
          .toStrictEqual(expect.arrayContaining(responseBodyUndo.events[2].metadata.related_events));
        expect
          .soft(expectedMetadataContents)
          .toStrictEqual(expect.arrayContaining(responseBodyUndo.events[2].metadata.contents));
        expect(responseBodyUndo).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: expectedAffectedUsers,
          },
          events: expect.arrayContaining(expectedEvents),
        });

        const createdUndoEventResponse = responseBodyUndo.events[1];
        expect(Date.parse(createdUndoEventResponse.created_at)).not.toBeNaN();
        expect(uuidVersion(createdUndoEventResponse.id)).toBe(4);

        // Get first event
        const getFirewallEventRequestBuilder = new RequestBuilder('/api/v1/events/firewall');
        await getFirewallEventRequestBuilder.buildUser({ with: ['read:firewall'] });

        const { response: responseFirewall1, responseBody: responseBodyFirewall1 } =
          await getFirewallEventRequestBuilder.get(`/${firewallEvent1.id}`);

        expect.soft(responseFirewall1.status).toBe(200);

        expect(responseBodyFirewall1).toStrictEqual({
          affected: {
            contents: expect.arrayContaining(expectedAffectedContents),
            users: expectedAffectedUsers,
          },
          events: expect.arrayContaining(expectedEvents),
        });
      });
    });
  });
});

function mapContentData(content) {
  return {
    body: content.body,
    children_deep_count: +content.children_deep_count || 0,
    created_at: content.created_at.toISOString?.() ?? content.created_at,
    deleted_at: content.deleted_at?.toISOString?.() ?? content.deleted_at,
    id: content.id,
    owner_id: content.owner_id,
    owner_username: content.owner_username,
    parent_id: content.parent_id,
    published_at: content.published_at.toISOString?.() ?? content.published_at,
    slug: content.slug,
    source_url: content.source_url,
    status: content.status,
    tabcoins: +content.tabcoins,
    tabcoins_credit: +content.tabcoins_credit,
    tabcoins_debit: +content.tabcoins_debit,
    title: content.title,
    type: content.type,
    updated_at: content.updated_at.toISOString?.() ?? content.updated_at,
  };
}

function mapUserData(user) {
  return {
    created_at: user.created_at.toISOString?.() ?? user.created_at,
    description: user.description,
    features: user.features,
    id: user.id,
    tabcash: user.tabcash || 0,
    tabcoins: user.tabcoins || 0,
    updated_at: user.updated_at.toISOString?.() ?? user.updated_at,
    username: user.username,
  };
}

function mapFirewallEventData(firewallEvent) {
  return {
    created_at: firewallEvent.created_at.toISOString(),
    id: firewallEvent.id,
    metadata: firewallEvent.metadata,
    originator_user_id: firewallEvent.originator_user_id,
    type: firewallEvent.type,
  };
}
