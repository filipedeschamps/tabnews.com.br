import { randomUUID } from 'node:crypto';
import { version as uuidVersion } from 'uuid';

import content from 'models/content';
import user from 'models/user';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('POST /api/v1/moderations/undo_firewall/[id]', () => {
  async function createUserViaApi(body) {
    const request = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: body.username,
        email: body.email,
        password: 'password',
      }),
    });

    const requestBody = await request.json();
    return requestBody;
  }

  async function createContentViaApi(token, body) {
    const request = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
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

    const requestBody = await request.json();
    return requestBody;
  }

  describe('Anonymous user', () => {
    test('Undoing a firewall side-effect', async () => {
      const eventId = randomUUID();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "undo:firewall".',
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
    test('Undoing a firewall side-effect', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);

      const eventId = randomUUID();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "undo:firewall".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('User with "undo:firewall" feature', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
      await orchestrator.createFirewallTestFunctions();
    });

    test('With a malformatted string as "id"', async () => {
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(user);
      await orchestrator.addFeaturesToUser(user, ['undo:firewall']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/random`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${userSession.token}`,
        },
      });

      const responseBody = await response.json();

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

    test('With an "id" that does not exist', async () => {
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(user);
      await orchestrator.addFeaturesToUser(user, ['undo:firewall']);

      const eventId = randomUUID();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${userSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: `O id "${eventId}" não foi encontrado no sistema.`,
        action: 'Verifique se o "id" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:UNDO_ALL_FIREWALL_SIDE_EFFECTS:NOT_FOUND',
        key: 'id',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With an "id" that is not a firewall event', async () => {
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(user);
      await orchestrator.addFeaturesToUser(user, ['undo:firewall']);

      await orchestrator.createContent({
        owner_id: user.id,
        title: 'Create event',
      });
      const lastEvent = await orchestrator.getLastEvent();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${lastEvent.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${userSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando desfazer um evento inválido.',
        action: 'Utilize um "id" que aponte para um evento de firewall.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:FIREWALL:UNDO_ALL_FIREWALL_SIDE_EFFECTS:INVALID_EVENT_TYPE',
        key: 'type',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With a "firewall:block_users" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);

      // Create users
      const ignoredUser = await orchestrator.createUser();

      const user1Response = await createUserViaApi({
        username: 'firstUser',
        email: 'first-user@gmail.com',
      });
      await orchestrator.activateUser(user1Response);

      const user1 = await user.findOneById(user1Response.id, { withBalance: true });
      expect(user1.features).toStrictEqual([
        'create:session',
        'read:session',
        'create:content',
        'create:content:text_root',
        'create:content:text_child',
        'update:content',
        'update:user',
      ]);

      const user2Response = await createUserViaApi({
        username: 'secondUser',
        email: 'second-user@gmail.com',
      });

      const user2 = await user.findOneById(user2Response.id, { withBalance: true });
      expect(user2.features).toStrictEqual(['read:activation_token']);

      const user3Response = await createUserViaApi({
        username: 'thirdUser',
        email: 'third-user@gmail.com',
      });

      expect(user3Response.status_code).toEqual(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toEqual('firewall:block_users');
      expect(firewallEvent.metadata.users).toStrictEqual([user1.id, user2.id]);

      // Undo firewall side-effect
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const responseBody = await response.json();

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
              updated_at: responseBody.affected.users[0].updated_at,
              username: user1.username,
            },
            {
              created_at: user2.created_at.toISOString(),
              description: user2.description,
              features: responseBody.affected.users[1].features,
              id: user2.id,
              tabcash: user2.tabcash,
              tabcoins: user2.tabcoins,
              updated_at: responseBody.affected.users[1].updated_at,
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

      expect(Date.parse(user1AfterUndoResponse.updated_at)).not.toEqual(NaN);
      expect(new Date(user1AfterUndoResponse.updated_at)).not.toEqual(user1.updated_at);
      expect(user1AfterUndoResponse.features.sort()).toStrictEqual(user1.features.sort());

      expect(Date.parse(user2AfterUndoResponse.updated_at)).not.toEqual(NaN);
      expect(new Date(user2AfterUndoResponse.updated_at)).not.toEqual(user2.updated_at);
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
        updated_at: new Date(user1AfterUndoResponse.updated_at),
      });
      expect(user1AfterUndo.features.sort()).toStrictEqual(user1AfterUndoResponse.features.sort());

      expect(user2AfterUndo).toStrictEqual({
        ...user2,
        features: user2AfterUndo.features,
        updated_at: new Date(user2AfterUndoResponse.updated_at),
      });
      expect(user2AfterUndo.features.sort()).toStrictEqual(user2AfterUndoResponse.features.sort());
    });

    test('With a "firewall:block_users" event without "read:firewall" feature', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['undo:firewall']);

      // Create users
      await createUserViaApi({
        username: 'firstUser',
        email: 'first-user@gmail.com',
      });

      await createUserViaApi({
        username: 'secondUser',
        email: 'second-user@gmail.com',
      });

      const user3Response = await createUserViaApi({
        username: 'thirdUser',
        email: 'third-user@gmail.com',
      });

      expect(user3Response.status_code).toEqual(429);

      // Check firewall side-effect
      let allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      expect(firewallEvent.type).toEqual('firewall:block_users');

      // Undo firewall side-effect
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toEqual({});

      // Check "undo" event
      allEvents = await event.findAll();
      const undoEvent = allEvents.at(-1);
      expect(undoEvent.type).toEqual('moderation:unblock_users');
    });

    test('Undo the same event twice', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['undo:firewall']);

      // Create users
      const user1 = await createUserViaApi({
        username: 'firstUser',
        email: 'first-user@gmail.com',
      });
      const user2 = await createUserViaApi({
        username: 'secondUser',
        email: 'second-user@gmail.com',
      });
      const user3 = await createUserViaApi({
        username: 'thirdUser',
        email: 'third-user@gmail.com',
      });

      expect(user3.status_code).toEqual(429);

      // Check firewall side-effect
      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent.type).toEqual('firewall:block_users');
      expect(firewallEvent.metadata.users).toStrictEqual([user1.id, user2.id]);

      // Undo firewall side-effect
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      expect(response.status).toEqual(200);

      // Undo firewall side-effect again
      const responseAgain = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      const responseAgainBody = await responseAgain.json();

      expect(responseAgain.status).toEqual(400);

      expect(responseAgainBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando desfazer um evento que já foi desfeito.',
        action: 'Utilize um "id" que aponte para um evento de firewall que ainda não foi desfeito.',
        status_code: 400,
        error_id: responseAgainBody.error_id,
        request_id: responseAgainBody.request_id,
        error_location_code: 'MODEL:FIREWALL:UNDO_ALL_FIREWALL_SIDE_EFFECTS:EVENT_ALREADY_REVERSED',
        key: 'id',
      });
    });

    test('With a "firewall:block_contents:text_root" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      let ignoredContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Ignored content',
      });
      ignoredContent = await content.findOne({ where: { id: ignoredContent.id } });

      const content1 = await createContentViaApi(user1Session.token, { title: 'Título 1' });
      const content2 = await createContentViaApi(user1Session.token, { title: 'Título 2' });
      const content3 = await createContentViaApi(user1Session.token, { title: 'Título 3' });

      expect(content3.status_code).toEqual(429);

      // Check firewall side-effect
      const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
      const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

      expect(content1AfterSideEffect.status).toEqual('firewall');
      expect(content2AfterSideEffect.status).toEqual('firewall');

      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent).not.toBeUndefined();
      expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      const responseBody = await response.json();

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
              updated_at: responseBody.affected.contents[0].updated_at,
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
              updated_at: responseBody.affected.contents[1].updated_at,
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

      const content1AfterUndoResponse = responseBody.affected.contents[0];
      const content2AfterUndoResponse = responseBody.affected.contents[1];

      expect(Date.parse(content1AfterUndoResponse.updated_at)).not.toEqual(NaN);
      expect(new Date(content1AfterUndoResponse.updated_at)).not.toEqual(content1.updated_at);

      expect(Date.parse(content2AfterUndoResponse.updated_at)).not.toEqual(NaN);
      expect(new Date(content2AfterUndoResponse.updated_at)).not.toEqual(content2.updated_at);

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
        deleted_at: null,
        status: 'published',
        updated_at: expect.any(Date),
      });
      expect(content1AfterUndo.updated_at).not.toEqual(content1AfterSideEffect.updated_at);

      expect(content2AfterUndo).toStrictEqual({
        ...content2AfterSideEffect,
        deleted_at: null,
        status: 'published',
        updated_at: expect.any(Date),
      });
      expect(content2AfterUndo.updated_at).not.toEqual(content2AfterSideEffect.updated_at);
    });

    test('With a "firewall:block_contents:text_root" event with TabCoins and a deleted content', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);

      // Create users and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const user2 = await orchestrator.createUser();
      await orchestrator.activateUser(user2);
      const user2Session = await orchestrator.createSession(user2);

      const ignoredUser = await orchestrator.createUser();

      const content1 = await createContentViaApi(user1Session.token, { title: 'Título 1' });
      const content2 = await createContentViaApi(user2Session.token, { title: 'Título 2' });

      await orchestrator.createRate(content1, 8);
      await orchestrator.createRate(content2, 15);

      const content1Deleted = await orchestrator.updateContent(content1.id, { status: 'deleted' });

      const user1AfterContentDeleted = await user.findOneById(user1.id, { withBalance: true });
      expect(user1AfterContentDeleted.tabcoins).toEqual(0);

      const user2AfterRate = await user.findOneById(user2.id, { withBalance: true });
      expect(user2AfterRate.tabcoins).toEqual(15);

      const content3 = await createContentViaApi(user1Session.token, { title: 'Título 3' });

      expect(content3.status_code).toEqual(429);

      // Check firewall side-effect
      const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
      const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

      expect(content1AfterSideEffect.status).toEqual('firewall');
      expect(content2AfterSideEffect.status).toEqual('firewall');

      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent).not.toBeUndefined();
      expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      const responseBody = await response.json();

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
              updated_at: responseBody.affected.contents[0].updated_at,
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
              updated_at: responseBody.affected.contents[1].updated_at,
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

    test('With a "firewall:block_contents:text_child" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      let rootContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Ignored content',
      });

      const content1 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });
      const content2 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });

      rootContent = await content.findOne({ where: { id: rootContent.id } });

      const content3 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });

      expect(content3.status_code).toEqual(429);

      // Check firewall side-effect
      const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
      const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

      expect(content1AfterSideEffect.status).toEqual('firewall');
      expect(content2AfterSideEffect.status).toEqual('firewall');

      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent).not.toBeUndefined();
      expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      const responseBody = await response.json();

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
              updated_at: responseBody.affected.contents[0].updated_at,
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
              updated_at: responseBody.affected.contents[1].updated_at,
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

      const content1AfterUndoResponse = responseBody.affected.contents[0];
      const content2AfterUndoResponse = responseBody.affected.contents[1];

      expect(Date.parse(content1AfterUndoResponse.updated_at)).not.toEqual(NaN);
      expect(new Date(content1AfterUndoResponse.updated_at)).not.toEqual(content1.updated_at);

      expect(Date.parse(content2AfterUndoResponse.updated_at)).not.toEqual(NaN);
      expect(new Date(content2AfterUndoResponse.updated_at)).not.toEqual(content2.updated_at);

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
      const content1AfterUndo = await content.findOne({ where: { id: content1AfterSideEffect.id } });
      const content2AfterUndo = await content.findOne({ where: { id: content2AfterSideEffect.id } });
      const rootContentAfterUndo = await content.findOne({ where: { id: rootContent.id } });

      expect(rootContentAfterUndo).toStrictEqual(rootContent);

      expect(content1AfterUndo).toStrictEqual({
        ...content1AfterSideEffect,
        deleted_at: null,
        status: 'published',
        updated_at: expect.any(Date),
      });
      expect(content1AfterUndo.updated_at).not.toEqual(content1AfterSideEffect.updated_at);

      expect(content2AfterUndo).toStrictEqual({
        ...content2AfterSideEffect,
        deleted_at: null,
        status: 'published',
        updated_at: expect.any(Date),
      });
      expect(content2AfterUndo.updated_at).not.toEqual(content2AfterSideEffect.updated_at);
    });

    test('With a "firewall:block_contents:text_child" event and a deleted content', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const rootContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Ignored content',
      });

      const content1 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });
      const content2 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });

      const content2Deleted = await content.update(content2.id, { status: 'deleted' });

      const content3 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });

      expect(content3.status_code).toEqual(429);

      // Check firewall side-effect
      const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
      const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

      expect(content1AfterSideEffect.status).toEqual('firewall');
      expect(content2AfterSideEffect.status).toEqual('firewall');

      const firewallEvent = await orchestrator.getLastEvent();

      expect(firewallEvent).not.toBeUndefined();
      expect(firewallEvent.metadata.contents).toStrictEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      const responseBody = await response.json();

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
              updated_at: responseBody.affected.contents[0].updated_at,
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
              updated_at: responseBody.affected.contents[1].updated_at,
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
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      const firewallUserSession = await orchestrator.createSession(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const rootContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Ignored content',
      });

      const content1 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });
      const content2 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });

      const content1Deleted = await content.update(content1.id, { status: 'deleted' });
      const content2Deleted = await content.update(content2.id, { status: 'deleted' });

      const content3 = await createContentViaApi(user1Session.token, { parent_id: rootContent.id });

      expect(content3.status_code).toEqual(429);

      // Check firewall side-effect
      const content1AfterSideEffect = await content.findOne({ where: { id: content1.id } });
      const content2AfterSideEffect = await content.findOne({ where: { id: content2.id } });

      expect(content1AfterSideEffect.status).toEqual('firewall');
      expect(content2AfterSideEffect.status).toEqual('firewall');

      let allEvents = await event.findAll();
      const firewallEvent = allEvents.find((event) => event.type === 'firewall:block_contents:text_child');

      expect(firewallEvent).not.toBeUndefined();
      expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${firewallEvent.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firewallUserSession.token}`,
          },
        },
      );

      const responseBody = await response.json();

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
              updated_at: responseBody.affected.contents[0].updated_at,
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
              updated_at: responseBody.affected.contents[1].updated_at,
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
});
