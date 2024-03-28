import fetch from 'cross-fetch';
import { randomUUID } from 'node:crypto';
import { version as uuidVersion } from 'uuid';

import content from 'models/content';
import event from 'models/event';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.createFirewallTestFunctions();
});

describe('GET /api/v1/events/firewall/[id]', () => {
  async function createUserRequest(body) {
    const request = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
      method: 'POST',
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

  async function createContentRequest(token, body) {
    const request = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
      method: 'POST',
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

  async function undoFirewallRequest(token, id) {
    const request = await fetch(`${orchestrator.webserverUrl}/api/v1/moderations/undo_firewall/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${token}`,
      },
    });

    return request;
  }

  async function getUser(token, user) {
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${user.username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        cookie: `session_id=${token}`,
      },
    });
    const responseBody = await response.json();
    return responseBody;
  }

  function mapContentData(content) {
    const isDeleted = content.status === 'deleted';

    return {
      body: isDeleted ? '[Não disponível]' : content.body,
      children_deep_count: +content.children_deep_count,
      created_at: content.created_at.toISOString(),
      deleted_at: content.deleted_at?.toISOString() ?? null,
      id: content.id,
      owner_id: content.owner_id,
      owner_username: content.owner_username,
      parent_id: content.parent_id,
      published_at: content.published_at.toISOString(),
      slug: isDeleted ? 'nao-disponivel' : content.slug,
      source_url: content.source_url,
      status: content.status,
      tabcoins: +content.tabcoins,
      tabcoins_credit: +content.tabcoins_credit,
      tabcoins_debit: +content.tabcoins_debit,
      title: isDeleted ? '[Não disponível]' : content.title,
      updated_at: content.updated_at.toISOString(),
    };
  }

  describe('Anonymous user', () => {
    test('Undoing a firewall side-effect', async () => {
      const eventId = randomUUID();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseBody = await response.json();

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
    test('Undoing a firewall side-effect', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);

      const eventId = randomUUID();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },
      });

      const responseBody = await response.json();

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
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(user);
      await orchestrator.addFeaturesToUser(user, ['read:firewall']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/random`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${userSession.token}`,
        },
      });

      const responseBody = await response.json();

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
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(user);
      await orchestrator.addFeaturesToUser(user, ['read:firewall']);

      const eventId = randomUUID();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${userSession.token}`,
        },
      });

      const responseBody = await response.json();

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
      const user = await orchestrator.createUser();
      await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(user);
      await orchestrator.addFeaturesToUser(user, ['read:firewall']);

      await orchestrator.createContent({
        owner_id: user.id,
        title: 'Create event',
      });
      const contentEvent = (await event.findAll())[0];

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${contentEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${userSession.token}`,
        },
      });

      const responseBody = await response.json();

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
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall']);
      const firewallUserSession = await orchestrator.createSession(firewallUser);

      // Create users
      const user1 = await createUserRequest({
        username: 'firstUser',
        email: 'first-user@gmail.com',
      });
      const user2 = await createUserRequest({
        username: 'secondUser',
        email: 'second-user@gmail.com',
      });
      const user3Response = await createUserRequest({
        username: 'thirdUser',
        email: 'third-user@gmail.com',
      });

      expect(user3Response.status_code).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const request = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${firewallEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const requestBody = await request.json();

      expect(request.status).toEqual(200);

      const user1AfterFirewall = await getUser(firewallUserSession.token, user1);
      const user2AfterFirewall = await getUser(firewallUserSession.token, user2);

      expect(requestBody).toEqual({
        affected: {
          users: [user1AfterFirewall, user2AfterFirewall],
        },
        events: [
          {
            created_at: requestBody.events[0].created_at,
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

      expect(Date.parse(requestBody.events[0].created_at)).not.toEqual(NaN);
    });

    test('With a reversed "firewall:block_users" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);
      const firewallUserSession = await orchestrator.createSession(firewallUser);

      // Create users
      const user1 = await createUserRequest({
        username: 'firstUser',
        email: 'first-user@gmail.com',
      });
      const user2 = await createUserRequest({
        username: 'secondUser',
        email: 'second-user@gmail.com',
      });
      const user3Response = await createUserRequest({
        username: 'thirdUser',
        email: 'third-user@gmail.com',
      });

      expect(user3Response.status_code).toEqual(429);

      // Check firewall side-effect
      let allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      expect(firewallEvent.type).toEqual('firewall:block_users');
      expect(firewallEvent.metadata.users).toEqual([user1.id, user2.id]);

      // Undo firewall side-effect
      const undoRequest = await undoFirewallRequest(firewallUserSession.token, firewallEvent.id);
      expect(undoRequest.status).toEqual(200);

      // Get reversed firewall event
      allEvents = await event.findAll();
      const reversedEvent = allEvents.at(-1);

      const request = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${firewallEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const requestBody = await request.json();

      expect(request.status).toEqual(200);

      const user1AfterReverse = await getUser(firewallUserSession.token, user1);
      const user2AfterReverse = await getUser(firewallUserSession.token, user2);

      expect(requestBody).toEqual({
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
            created_at: requestBody.events[1].created_at,
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

      expect(Date.parse(requestBody.events[1].created_at)).not.toEqual(NaN);
    });

    test('With a "firewall:block_contents:text_root" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall']);
      const firewallUserSession = await orchestrator.createSession(firewallUser);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const content1 = await createContentRequest(user1Session.token, { title: 'Título 1' });
      const content2 = await createContentRequest(user1Session.token, { title: 'Título 2' });
      const content3 = await createContentRequest(user1Session.token, { title: 'Título 3' });

      expect(content3.status_code).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const request = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${firewallEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const requestBody = await request.json();

      expect(request.status).toEqual(200);

      const user1AfterFirewall = await getUser(firewallUserSession.token, user1);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(requestBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall],
        },
        events: [
          {
            created_at: requestBody.events[0].created_at,
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

      expect(Date.parse(requestBody.events[0].created_at)).not.toEqual(NaN);
    });

    test('With a reversed "firewall:block_contents:text_root" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);
      const firewallUserSession = await orchestrator.createSession(firewallUser);

      // Create users and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const content1 = await createContentRequest(user1Session.token, { title: 'Título 1' });
      const content2 = await createContentRequest(user1Session.token, { title: 'Título 2' });
      const content3 = await createContentRequest(user1Session.token, { title: 'Título 3' });

      expect(content3.status_code).toEqual(429);

      // Check firewall side-effect
      let allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      expect(firewallEvent.type).toEqual('firewall:block_contents:text_root');
      expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const undoRequest = await undoFirewallRequest(firewallUserSession.token, firewallEvent.id);
      expect(undoRequest.status).toEqual(200);

      // Get reversed firewall event
      allEvents = await event.findAll();
      const reversedEvent = allEvents.at(-1);

      const request = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${firewallEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const requestBody = await request.json();

      expect(request.status).toEqual(200);

      const user1AfterFirewall = await getUser(firewallUserSession.token, user1);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(requestBody).toEqual({
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
            created_at: requestBody.events[1].created_at,
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

      expect(Date.parse(requestBody.events[1].created_at)).not.toEqual(NaN);
    });

    test('With a "firewall:block_contents:text_child" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall']);
      const firewallUserSession = await orchestrator.createSession(firewallUser);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const rootContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Root content',
      });

      const content1 = await createContentRequest(user1Session.token, { parent_id: rootContent.id });
      const content2 = await createContentRequest(user1Session.token, { parent_id: rootContent.id });
      const content3 = await createContentRequest(user1Session.token, { parent_id: rootContent.id });

      expect(content3.status_code).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const request = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${firewallEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const requestBody = await request.json();

      expect(request.status).toEqual(200);

      const user1AfterFirewall = await getUser(firewallUserSession.token, user1);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(requestBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall],
        },
        events: [
          {
            created_at: requestBody.events[0].created_at,
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

      expect(Date.parse(requestBody.events[0].created_at)).not.toEqual(NaN);
    });

    test('With a reversed "firewall:block_contents:text_child" event', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall', 'undo:firewall']);
      const firewallUserSession = await orchestrator.createSession(firewallUser);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const rootContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Root content',
      });

      const content1 = await createContentRequest(user1Session.token, { parent_id: rootContent.id });
      const content2 = await createContentRequest(user1Session.token, { parent_id: rootContent.id });
      const content3 = await createContentRequest(user1Session.token, { parent_id: rootContent.id });

      expect(content3.status_code).toEqual(429);

      // Check firewall side-effect
      let allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      expect(firewallEvent.type).toEqual('firewall:block_contents:text_child');
      expect(firewallEvent.metadata.contents).toEqual([content1.id, content2.id]);

      // Undo firewall side-effect
      const undoRequest = await undoFirewallRequest(firewallUserSession.token, firewallEvent.id);
      expect(undoRequest.status).toEqual(200);

      // Get reversed firewall event
      allEvents = await event.findAll();
      const reversedEvent = allEvents.at(-1);

      const request = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${firewallEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const requestBody = await request.json();

      expect(request.status).toEqual(200);

      const user1AfterFirewall = await getUser(firewallUserSession.token, user1);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(requestBody).toEqual({
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
            created_at: requestBody.events[1].created_at,
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

      expect(Date.parse(requestBody.events[1].created_at)).not.toEqual(NaN);
    });

    test('With a "firewall:block_contents:text_child" event involving multiple users', async () => {
      const firewallUser = await orchestrator.createUser();
      await orchestrator.activateUser(firewallUser);
      await orchestrator.addFeaturesToUser(firewallUser, ['read:firewall']);
      const firewallUserSession = await orchestrator.createSession(firewallUser);

      // Create user and contents
      let user1 = await orchestrator.createUser();
      user1 = await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      let user2 = await orchestrator.createUser();
      user2 = await orchestrator.activateUser(user2);
      const user2Session = await orchestrator.createSession(user2);

      const rootContent = await orchestrator.createContent({
        owner_id: firewallUser.id,
        title: 'Root content',
      });

      const content1 = await createContentRequest(user1Session.token, { parent_id: rootContent.id });
      const content2 = await createContentRequest(user2Session.token, { parent_id: rootContent.id });
      const content3 = await createContentRequest(user2Session.token, { parent_id: rootContent.id });

      expect(content3.status_code).toEqual(429);

      // Get firewall side-effect
      const allEvents = await event.findAll();
      const firewallEvent = allEvents.at(-1);

      const request = await fetch(`${orchestrator.webserverUrl}/api/v1/events/firewall/${firewallEvent.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firewallUserSession.token}`,
        },
      });

      const requestBody = await request.json();

      expect(request.status).toEqual(200);

      const user1AfterFirewall = await getUser(firewallUserSession.token, user1);
      const user2AfterFirewall = await getUser(firewallUserSession.token, user2);

      const content1AfterFirewall = await content.findOne({ where: { id: content1.id } });
      const content2AfterFirewall = await content.findOne({ where: { id: content2.id } });

      expect(requestBody).toEqual({
        affected: {
          contents: [mapContentData(content1AfterFirewall), mapContentData(content2AfterFirewall)],
          users: [user1AfterFirewall, user2AfterFirewall],
        },
        events: [
          {
            created_at: requestBody.events[0].created_at,
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

      expect(Date.parse(requestBody.events[0].created_at)).not.toEqual(NaN);
    });
  });
});
