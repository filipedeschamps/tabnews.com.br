import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('models/event', () => {
  describe('Anonymous user', () => {
    test('Create "create:user" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: createUserResponseBody } = await usersRequestBuilder.post({
        username: 'validusername',
        email: 'valid@email.com',
        password: 'validpassword',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'create:user',
        originator_user_id: createUserResponseBody.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: createUserResponseBody.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });
  });

  test('Create "update:user" event for password update', async () => {
    const defaultUser = await orchestrator.createUser();
    const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);

    const recoveryRequestBuilder = new RequestBuilder('/api/v1/recovery');
    await recoveryRequestBuilder.patch({
      token_id: recoveryToken.id,
      password: 'newPassword',
    });

    const lastEvent = await orchestrator.getLastEvent();

    expect(lastEvent).toStrictEqual({
      id: lastEvent.id,
      type: 'update:user',
      originator_user_id: null,
      originator_ip: '127.0.0.1',
      created_at: lastEvent.created_at,
      metadata: {
        id: defaultUser.id,
        updatedFields: ['password'],
      },
    });

    expect(uuidVersion(lastEvent.id)).toBe(4);
    expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
  });

  describe('Default user', () => {
    test('Create "update:user" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const defaultUser = await usersRequestBuilder.buildUser();

      const { responseBody } = await usersRequestBuilder.patch(`/${defaultUser.username}`, {
        username: 'newusername',
        description: 'new description',
        email: 'new@email.com',
        notifications: false,
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:user',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: defaultUser.id,
          updatedFields: ['description', 'notifications', 'username'],
          username: {
            old: defaultUser.username,
            new: responseBody.username,
          },
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "create:content:text_root" event', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: createContentRootResponseBody } = await contentsRequestBuilder.post({
        title: 'Root',
        body: 'Root',
        status: 'published',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'create:content:text_root',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: createContentRootResponseBody.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "create:content:text_child" event', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: createContentRootResponseBody } = await contentsRequestBuilder.post({
        title: 'Root',
        body: 'Root',
        status: 'published',
      });

      const { responseBody: createContentChildResponseBody } = await contentsRequestBuilder.post({
        title: 'Child',
        body: 'Child',
        status: 'published',
        parent_id: createContentRootResponseBody.id,
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'create:content:text_child',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: createContentChildResponseBody.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:content:text_root" event', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: createContentRootResponseBody } = await contentsRequestBuilder.post({
        title: 'Root',
        body: 'Root',
        status: 'published',
      });

      await contentsRequestBuilder.patch(`/${defaultUser.username}/${createContentRootResponseBody.slug}`, {
        title: 'Root Updated',
        body: 'Root Updated',
        status: 'deleted',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:content:text_root',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: createContentRootResponseBody.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:content:text_child" event', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: createContentRootResponseBody } = await contentsRequestBuilder.post({
        title: 'Root',
        body: 'Root',
        status: 'published',
      });

      const { responseBody: createContentChildResponseBody } = await contentsRequestBuilder.post({
        body: 'Child',
        status: 'published',
        parent_id: createContentRootResponseBody.id,
      });

      await contentsRequestBuilder.patch(`/${defaultUser.username}/${createContentChildResponseBody.slug}`, {
        body: 'Child Updated',
        status: 'deleted',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:content:text_child',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: createContentChildResponseBody.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:content:tabcoins" with "transaction_type" set to "credit"', async () => {
      const firstUser = await orchestrator.createUser();
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      const tabcoinsRequestBuilder = new RequestBuilder(
        `/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
      );
      const secondUser = await tabcoinsRequestBuilder.buildUser();

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 2,
      });

      await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:content:tabcoins',
        originator_user_id: secondUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          amount: 2,
          content_id: firstUserContent.id,
          from_user_id: secondUser.id,
          content_owner_id: firstUser.id,
          transaction_type: 'credit',
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:content:tabcoins" with "transaction_type" set to "debit"', async () => {
      const firstUser = await orchestrator.createUser();
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      const tabcoinsRequestBuilder = new RequestBuilder(
        `/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
      );
      const secondUser = await tabcoinsRequestBuilder.buildUser();

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 2,
      });

      await tabcoinsRequestBuilder.post({
        transaction_type: 'debit',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:content:tabcoins',
        originator_user_id: secondUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          amount: 2,
          content_id: firstUserContent.id,
          from_user_id: secondUser.id,
          content_owner_id: firstUser.id,
          transaction_type: 'debit',
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "reward:user:tabcoins" event', async () => {
      const userRequestBuilder = new RequestBuilder('/api/v1/user');
      const defaultUser = await userRequestBuilder.buildUser();
      await orchestrator.createPrestige(defaultUser.id);

      await orchestrator.updateRewardedAt(
        defaultUser.id,
        new Date(Date.now() - 1000 - 1000 * 60 * 60 * 24), // 1 day and 1 second ago
      );

      await userRequestBuilder.get();

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'reward:user:tabcoins',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          amount: 2,
          reward_type: 'daily',
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
      expect(Date.parse(lastEvent.created_at)).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('TOTP', () => {
    test('Create "totp:start_setup"', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const defaultUser = await requestBuilder.buildUser();

      await requestBuilder.post(`/${defaultUser.username}/totp`);

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'totp:start_setup',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: null,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:user" for TOTP enabled', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const defaultUser = await requestBuilder.buildUser();
      const userTotp = await orchestrator.createTemporaryTotp(defaultUser);

      await requestBuilder.patch(`/${defaultUser.username}/totp`, {
        totp_token: userTotp.generate(),
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:user',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: defaultUser.id,
          updatedFields: ['totp_secret'],
          totp_enabled: {
            old: false,
            new: true,
          },
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:user" for TOTP disabled', async () => {
      const defaultUser = await orchestrator.createUser({ password: 'validPassword' });
      await orchestrator.activateUser(defaultUser);
      const createdUserSession = await orchestrator.createSession(defaultUser);
      const userTotp = await orchestrator.enableTotp(defaultUser);

      await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}/totp`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${createdUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: userTotp.generate(),
          password: 'validPassword',
        }),
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:user',
        originator_user_id: defaultUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: defaultUser.id,
          updatedFields: ['totp_secret'],
          totp_enabled: {
            old: true,
            new: false,
          },
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();

      // Second time should not create a new event
      await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}/totp`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${createdUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: '000000',
          password: 'validPassword',
        }),
      });

      const lastEvent2 = await orchestrator.getLastEvent();
      expect(lastEvent2).toStrictEqual(lastEvent);
    });
  });

  describe('Privileged user', () => {
    test('Create "update:user" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const userToBeUpdated = await usersRequestBuilder.buildUser();
      const privilegedUser = await usersRequestBuilder.buildUser({ with: ['update:user:others'] });

      await usersRequestBuilder.patch(`/${userToBeUpdated.username}`, {
        username: 'newusername',
        description: 'new description',
        email: 'new@email.com',
        notifications: false,
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:user',
        originator_user_id: privilegedUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: userToBeUpdated.id,
          updatedFields: ['description'],
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "ban:user" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const userToBan = await usersRequestBuilder.buildUser();
      const privilegedUser = await usersRequestBuilder.buildUser({ with: ['ban:user'] });

      await usersRequestBuilder.delete(`/${userToBan.username}`, {
        ban_type: 'nuke',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'ban:user',
        originator_user_id: privilegedUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          ban_type: 'nuke',
          user_id: userToBan.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:content:text_root" event', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: createContentRootResponseBody } = await contentsRequestBuilder.post({
        title: 'Root',
        body: 'Root',
        status: 'published',
      });

      const privilegedUser = await contentsRequestBuilder.buildUser({ with: ['update:content:others'] });

      await contentsRequestBuilder.patch(`/${defaultUser.username}/${createContentRootResponseBody.slug}`, {
        title: 'Root Updated',
        body: 'Root Updated',
        status: 'deleted',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:content:text_root',
        originator_user_id: privilegedUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: createContentRootResponseBody.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "update:content:text_child" event', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: createContentRootResponseBody } = await contentsRequestBuilder.post({
        title: 'Root',
        body: 'Root',
        status: 'published',
      });

      const { responseBody: createContentChildResponseBody } = await contentsRequestBuilder.post({
        body: 'Child',
        status: 'published',
        parent_id: createContentRootResponseBody.id,
      });

      const privilegedUser = await contentsRequestBuilder.buildUser({ with: ['update:content:others'] });

      await contentsRequestBuilder.patch(`/${defaultUser.username}/${createContentChildResponseBody.slug}`, {
        body: 'Child Updated',
        status: 'deleted',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'update:content:text_child',
        originator_user_id: privilegedUser.id,
        originator_ip: '127.0.0.1',
        created_at: lastEvent.created_at,
        metadata: {
          id: createContentChildResponseBody.id,
        },
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });
  });

  describe('Firewall', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
      await orchestrator.createFirewallTestFunctions();
    });

    test('Create "firewall:block_users" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');

      const { responseBody: user1 } = await usersRequestBuilder.post({
        username: 'request1',
        email: 'request1@gmail.com',
        password: 'validpassword',
      });

      const { responseBody: user2 } = await usersRequestBuilder.post({
        username: 'request2',
        email: 'request2@gmail.com',
        password: 'validpassword',
      });

      await usersRequestBuilder.post({
        username: 'request3',
        email: 'request3@gmail.com',
        password: 'validpassword',
      });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'firewall:block_users',
        originator_user_id: null,
        originator_ip: '127.0.0.1',
        metadata: {
          from_rule: 'create:user',
          users: [user1.id, user2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "firewall:block_contents:text_root" event', async () => {
      const contentRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentRequestBuilder.buildUser();

      const { responseBody: content1 } = await contentRequestBuilder.post({
        title: 'Título 1',
        body: 'Corpo',
        status: 'published',
      });

      const { responseBody: content2 } = await contentRequestBuilder.post({
        title: 'Título 2',
        body: 'Corpo',
        status: 'published',
      });

      await contentRequestBuilder.post({
        title: 'Título 3',
        body: 'Corpo',
        status: 'published',
      });

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
    });

    test('Create "firewall:block_contents:text_child" event', async () => {
      const contentRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentRequestBuilder.buildUser();

      const { responseBody: rootContentBody } = await contentRequestBuilder.post({
        title: 'Root Content',
        body: 'Corpo',
      });

      const { responseBody: content1 } = await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      const { responseBody: content2 } = await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

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
    });
  });

  describe('Moderation', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
      await orchestrator.createFirewallTestFunctions();
    });

    test('Create "moderation:block_users" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');

      const { responseBody: user1 } = await usersRequestBuilder.post({
        username: 'request1',
        email: 'request1@gmail.com',
        password: 'validpassword',
      });

      const { responseBody: user2 } = await usersRequestBuilder.post({
        username: 'request2',
        email: 'request2@gmail.com',
        password: 'validpassword',
      });

      await usersRequestBuilder.post({
        username: 'request3',
        email: 'request3@gmail.com',
        password: 'validpassword',
      });

      const firewallEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      const reviewerUser = await reviewFirewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      await reviewFirewallRequestBuilder.post({ action: 'confirm' });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'moderation:block_users',
        originator_user_id: reviewerUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          related_events: [firewallEvent.id],
          users: [user1.id, user2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "moderation:unblock_users" event', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');

      const { responseBody: user1 } = await usersRequestBuilder.post({
        username: 'request1',
        email: 'request1@gmail.com',
        password: 'validpassword',
      });

      const { responseBody: user2 } = await usersRequestBuilder.post({
        username: 'request2',
        email: 'request2@gmail.com',
        password: 'validpassword',
      });

      await usersRequestBuilder.post({
        username: 'request3',
        email: 'request3@gmail.com',
        password: 'validpassword',
      });

      const firewallEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      const reviewerUser = await reviewFirewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      await reviewFirewallRequestBuilder.post({ action: 'undo' });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'moderation:unblock_users',
        originator_user_id: reviewerUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          related_events: [firewallEvent.id],
          users: [user1.id, user2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "moderation:block_contents:text_root" event', async () => {
      const contentRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentRequestBuilder.buildUser();

      const { responseBody: content1 } = await contentRequestBuilder.post({
        title: 'Título 1',
        body: 'Corpo',
        status: 'published',
      });

      const { responseBody: content2 } = await contentRequestBuilder.post({
        title: 'Título 2',
        body: 'Corpo',
        status: 'published',
      });

      await contentRequestBuilder.post({
        title: 'Título 3',
        body: 'Corpo',
        status: 'published',
      });

      const firewallEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      const reviewerUser = await reviewFirewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      await reviewFirewallRequestBuilder.post({ action: 'confirm' });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'moderation:block_contents:text_root',
        originator_user_id: reviewerUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          related_events: [firewallEvent.id],
          contents: [content1.id, content2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "moderation:unblock_contents:text_root" event', async () => {
      const contentRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentRequestBuilder.buildUser();

      const { responseBody: content1 } = await contentRequestBuilder.post({
        title: 'Título 1',
        body: 'Corpo',
        status: 'published',
      });

      const { responseBody: content2 } = await contentRequestBuilder.post({
        title: 'Título 2',
        body: 'Corpo',
        status: 'published',
      });

      await contentRequestBuilder.post({
        title: 'Título 3',
        body: 'Corpo',
        status: 'published',
      });

      const firewallEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      const reviewerUser = await reviewFirewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      await reviewFirewallRequestBuilder.post({ action: 'undo' });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'moderation:unblock_contents:text_root',
        originator_user_id: reviewerUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          related_events: [firewallEvent.id],
          contents: [content1.id, content2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "moderation:block_contents:text_child" event', async () => {
      const contentRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentRequestBuilder.buildUser();

      const { responseBody: rootContentBody } = await contentRequestBuilder.post({
        title: 'Root Content',
        body: 'Corpo',
      });

      const { responseBody: content1 } = await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      const { responseBody: content2 } = await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      const firewallEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      const reviewerUser = await reviewFirewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      await reviewFirewallRequestBuilder.post({ action: 'confirm' });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'moderation:block_contents:text_child',
        originator_user_id: reviewerUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          related_events: [firewallEvent.id],
          contents: [content1.id, content2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });

    test('Create "moderation:unblock_contents:text_child" event', async () => {
      const contentRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentRequestBuilder.buildUser();

      const { responseBody: rootContentBody } = await contentRequestBuilder.post({
        title: 'Root Content',
        body: 'Corpo',
      });

      const { responseBody: content1 } = await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      const { responseBody: content2 } = await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      await contentRequestBuilder.post({
        body: 'Corpo',
        parent_id: rootContentBody.id,
        status: 'published',
      });

      const firewallEvent = await orchestrator.getLastEvent();

      const reviewFirewallRequestBuilder = new RequestBuilder(
        `/api/v1/moderations/review_firewall/${firewallEvent.id}`,
      );
      const reviewerUser = await reviewFirewallRequestBuilder.buildUser({ with: ['read:firewall', 'review:firewall'] });

      await reviewFirewallRequestBuilder.post({ action: 'undo' });

      const lastEvent = await orchestrator.getLastEvent();

      expect(lastEvent).toStrictEqual({
        id: lastEvent.id,
        type: 'moderation:unblock_contents:text_child',
        originator_user_id: reviewerUser.id,
        originator_ip: '127.0.0.1',
        metadata: {
          related_events: [firewallEvent.id],
          contents: [content1.id, content2.id],
        },
        created_at: lastEvent.created_at,
      });

      expect(uuidVersion(lastEvent.id)).toBe(4);
      expect(Date.parse(lastEvent.created_at)).not.toBeNaN();
    });
  });
});
