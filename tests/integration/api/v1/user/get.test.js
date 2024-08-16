import { version as uuidVersion } from 'uuid';

import { defaultTabCashForAdCreation, relevantBody } from 'tests/constants-for-tests';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/user', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`);

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);
      expect.soft(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "read:session".');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });

    test('Retrieving the endpoint with malformatted "session_id" (too short)', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=tooshort`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"session_id" deve possuir 96 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('session_id');

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });

    test('Retrieving the endpoint with malformatted "session_id" (too long)', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=97characterslongggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"session_id" deve possuir 96 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('session_id');

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });

    test('Retrieving the endpoint with correct length "session_id", but with invalid characters', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=%208427a9as213d2a80da05b25c76b43fa539ec09303fb7ea146ba661208c1a475ed0d91847f16123d257c858994e4aaf8`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"session_id" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('session_id');

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });
  });

  describe('Default user', () => {
    test('With valid session and necessary features', async () => {
      const userRequestBuilder = new RequestBuilder('/api/v1/user');
      const defaultUser = await userRequestBuilder.buildUser();

      const { response, responseBody } = await userRequestBuilder.get();

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: defaultUser.username,
        description: defaultUser.description,
        email: defaultUser.email,
        notifications: defaultUser.notifications,
        features: defaultUser.features,
        tabcoins: 0,
        tabcash: 0,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: defaultUser.updated_at.toISOString(),
      });

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});

      const sessionObject = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);
      expect(sessionObject).toStrictEqual(userRequestBuilder.sessionObject);
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const userRequestBuilder = new RequestBuilder('/api/v1/user');
      await userRequestBuilder.buildUser({ without: ['read:session'] });

      const { response, responseBody } = await userRequestBuilder.get();

      expect.soft(response.status).toBe(403);
      expect.soft(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Você não possui permissão para executar esta ação.');
      expect(responseBody.action).toBe(
        'Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".',
      );
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe(
        'MODEL:AUTHENTICATION:INJECT_AUTHENTICATED_USER:USER_CANT_READ_SESSION',
      );

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });

    test('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 - 1000 * 60 * 60 * 24 * 30), // 30 days and 1 second ago
      });

      const userRequestBuilder = new RequestBuilder('/api/v1/user');
      await userRequestBuilder.buildUser();

      vi.useRealTimers();

      const { response, responseBody } = await userRequestBuilder.get();

      expect.soft(response.status).toBe(401);
      expect.soft(responseBody.status_code).toBe(401);
      expect(responseBody.name).toBe('UnauthorizedError');
      expect(responseBody.message).toBe('Usuário não possui sessão ativa.');
      expect(responseBody.action).toBe('Verifique se este usuário está logado.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet.session_id.name).toBe('session_id');
      expect(parsedCookiesFromGet.session_id.value).toBe('invalid');
      expect(parsedCookiesFromGet.session_id.maxAge).toBe(-1);
      expect(parsedCookiesFromGet.session_id.path).toBe('/');
      expect(parsedCookiesFromGet.session_id.httpOnly).toBe(true);

      const sessionObject = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);
      expect(sessionObject).toBeUndefined();
    });

    describe('Renew Session', () => {
      test('Should be able to renew with token almost expiring', async () => {
        // 29 days, 23 hours and 59 minutes (1 minute left to expire)
        vi.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 + 1000 * 60),
        });

        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();

        vi.useRealTimers();

        const sessionObjectBeforeRenew = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);

        const { response, responseBody } = await userRequestBuilder.get();

        expect.soft(response.status).toBe(200);
        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: defaultUser.username,
          description: defaultUser.description,
          email: defaultUser.email,
          notifications: defaultUser.notifications,
          features: defaultUser.features,
          tabcoins: 0,
          tabcash: 0,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: defaultUser.updated_at.toISOString(),
        });

        const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
        expect(parsedCookiesFromGet.session_id.name).toBe('session_id');
        expect(parsedCookiesFromGet.session_id.value).toBe(sessionObjectBeforeRenew.token);
        expect(parsedCookiesFromGet.session_id.maxAge).toBe(60 * 60 * 24 * 30);
        expect(parsedCookiesFromGet.session_id.path).toBe('/');
        expect(parsedCookiesFromGet.session_id.httpOnly).toBe(true);

        const sessionObjectAfterRenew = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);
        expect(sessionObjectBeforeRenew).toStrictEqual(userRequestBuilder.sessionObject);
        expect(sessionObjectAfterRenew.id).toBe(sessionObjectBeforeRenew.id);
        expect(sessionObjectAfterRenew.created_at).toStrictEqual(sessionObjectBeforeRenew.created_at);
        expect(sessionObjectAfterRenew.expires_at > sessionObjectBeforeRenew.expires_at).toBe(true);
        expect(sessionObjectAfterRenew.updated_at > sessionObjectBeforeRenew.updated_at).toBe(true);
      });

      test('Should be able to renew with 9 day token', async () => {
        vi.useFakeTimers({
          now: new Date(Date.now() - 1000 - 1000 * 60 * 60 * 24 * 9), // 9 days and 1 second ago
        });

        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();

        vi.useRealTimers();

        const sessionObjectBeforeRenew = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);

        expect(sessionObjectBeforeRenew).toStrictEqual(userRequestBuilder.sessionObject);

        const { response, responseBody } = await userRequestBuilder.get();

        expect.soft(response.status).toBe(200);
        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: defaultUser.username,
          description: defaultUser.description,
          email: defaultUser.email,
          notifications: defaultUser.notifications,
          features: defaultUser.features,
          tabcoins: 0,
          tabcash: 0,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: defaultUser.updated_at.toISOString(),
        });

        const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
        expect(parsedCookiesFromGet.session_id.name).toBe('session_id');
        expect(parsedCookiesFromGet.session_id.value).toBe(sessionObjectBeforeRenew.token);
        expect(parsedCookiesFromGet.session_id.maxAge).toBe(60 * 60 * 24 * 30);
        expect(parsedCookiesFromGet.session_id.path).toBe('/');
        expect(parsedCookiesFromGet.session_id.httpOnly).toBe(true);

        const sessionObjectAfterRenew = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);
        expect(sessionObjectAfterRenew.id).toBe(sessionObjectBeforeRenew.id);
        expect(sessionObjectAfterRenew.created_at).toStrictEqual(sessionObjectBeforeRenew.created_at);
        expect(sessionObjectAfterRenew.expires_at > sessionObjectBeforeRenew.expires_at).toBe(true);
        expect(sessionObjectAfterRenew.updated_at > sessionObjectBeforeRenew.updated_at).toBe(true);
      });

      test('Should not be able to renew with less than 9 days token', async () => {
        vi.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9 + 1000 * 60), // 1 minute left for 9 days
        });

        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();

        vi.useRealTimers();

        const sessionObjectBeforeRenew = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);

        expect(sessionObjectBeforeRenew).toStrictEqual(userRequestBuilder.sessionObject);

        const { response, responseBody } = await userRequestBuilder.get();

        expect.soft(response.status).toBe(200);
        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: defaultUser.username,
          description: defaultUser.description,
          email: defaultUser.email,
          notifications: defaultUser.notifications,
          features: defaultUser.features,
          tabcoins: 0,
          tabcash: 0,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: defaultUser.updated_at.toISOString(),
        });

        const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
        expect(parsedCookiesFromGet).toStrictEqual({});

        const sessionObjectAfterRenew = await orchestrator.findSessionByToken(userRequestBuilder.sessionObject.token);
        expect(sessionObjectAfterRenew).toStrictEqual(sessionObjectBeforeRenew);
      });
    });

    describe('Reward', () => {
      const defaultTestRewardValue = 2;

      test('Should be able to reward the user once a day', async () => {
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        const { response: preRewardUserResponse, responseBody: preRewardUser } = await userRequestBuilder.get();

        expect.soft(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toBe(0);
        expect(preRewardUser.tabcash).toBe(0);
        expect(preRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 - 1000 * 60 * 60 * 24), // 1 day and 1 second ago
        );

        const { response: rewardUserResponse, responseBody: rewardUser } = await userRequestBuilder.get();

        expect.soft(rewardUserResponse.status).toBe(200);
        expect(rewardUser.tabcoins).toBe(defaultTestRewardValue);
        expect(rewardUser.tabcash).toBe(0);
        expect(rewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());

        const { response: postRewardUserResponse, responseBody: postRewardUser } = await userRequestBuilder.get();

        expect.soft(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toBe(defaultTestRewardValue);
        expect(postRewardUser.tabcash).toBe(0);
        expect(postRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());
      });

      test('Should deduplicate simultaneous rewards', async () => {
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        const { response: preRewardUserResponse, responseBody: preRewardUser } = await userRequestBuilder.get();

        expect.soft(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toBe(0);
        expect(preRewardUser.tabcash).toBe(0);
        expect(preRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 - 1000 * 60 * 60 * 24), // 1 day and 1 second ago
        );

        const simultaneousResults = await Promise.all([userRequestBuilder.get(), userRequestBuilder.get()]);

        const tabcoins = simultaneousResults.map((result) => {
          expect.soft(result.response.status).toBe(200);
          return result.responseBody.tabcoins;
        });

        expect(tabcoins).toContain(defaultTestRewardValue);

        const { response: postRewardUserResponse, responseBody: postRewardUser } = await userRequestBuilder.get();

        expect.soft(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toBe(defaultTestRewardValue);
        expect(postRewardUser.tabcash).toBe(0);
        expect(postRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());
      });

      test('Should not reward if user has no prestige', async () => {
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();

        const { response: preRewardUserResponse, responseBody: preRewardUser } = await userRequestBuilder.get();

        expect.soft(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toBe(0);
        expect(preRewardUser.tabcash).toBe(0);
        expect(preRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
        );

        const simultaneousResults = await Promise.all([userRequestBuilder.get(), userRequestBuilder.get()]);

        simultaneousResults.forEach((result) => {
          expect.soft(result.response.status).toBe(200);
          expect(result.responseBody.tabcoins).toBe(0);
        });

        const { response: postRewardUserResponse, responseBody: postRewardUser } = await userRequestBuilder.get();

        expect.soft(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toBe(0);
        expect(postRewardUser.tabcash).toBe(0);
        expect(postRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());
      });

      test('Should not reward if user has negative prestige', async () => {
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -1 });

        const { response: preRewardUserResponse, responseBody: preRewardUser } = await userRequestBuilder.get();

        expect.soft(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toBe(0);
        expect(preRewardUser.tabcash).toBe(0);
        expect(preRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
        );

        const simultaneousResults = await Promise.all([userRequestBuilder.get(), userRequestBuilder.get()]);

        simultaneousResults.forEach((result) => {
          expect.soft(result.response.status).toBe(200);
          expect(result.responseBody.tabcoins).toBe(0);
        });

        const { response: postRewardUserResponse, responseBody: postRewardUser } = await userRequestBuilder.get();

        expect.soft(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toBe(0);
        expect(postRewardUser.tabcash).toBe(0);
        expect(postRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());
      });

      test('Should not reward if user has too many tabcoins', async () => {
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        await orchestrator.createBalance({
          balanceType: 'user:tabcoin',
          recipientId: defaultUser.id,
          amount: 1000,
        });

        const { response: preRewardUserResponse, responseBody: preRewardUser } = await userRequestBuilder.get();

        expect.soft(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toBe(1000);
        expect(preRewardUser.tabcash).toBe(0);
        expect(preRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
        );

        const simultaneousResults = await Promise.all([userRequestBuilder.get(), userRequestBuilder.get()]);

        simultaneousResults.forEach((result) => {
          expect.soft(result.response.status).toBe(200);
          expect(result.responseBody.tabcoins).toBe(1000);
        });

        const { response: postRewardUserResponse, responseBody: postRewardUser } = await userRequestBuilder.get();

        expect.soft(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toBe(1000);
        expect(postRewardUser.tabcash).toBe(0);
        expect(postRewardUser.updated_at).toBe(defaultUser.updated_at.toISOString());
      });

      test('Should be able to reward even with negative ad balance', async () => {
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();

        vi.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        });

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const adContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Ad Title',
          status: 'published',
          body: relevantBody,
          type: 'ad',
        });

        await orchestrator.createRate(adContent, -999);

        vi.useRealTimers();

        await orchestrator.createPrestige(defaultUser.id);

        const preRewardUser = await userRequestBuilder.get();

        expect.soft(preRewardUser.response.status).toBe(200);
        expect(preRewardUser.responseBody.tabcoins).toBe(-999);
        expect(preRewardUser.responseBody.tabcash).toBe(0);

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 - 1000 * 60 * 60 * 24), // 1 day and 1 second ago
        );

        const rewardedUser = await userRequestBuilder.get();

        expect.soft(rewardedUser.response.status).toBe(200);
        expect(rewardedUser.responseBody.tabcoins).toBe(defaultTestRewardValue - 999);
        expect(rewardedUser.responseBody.tabcash).toBe(0);
      });

      test('Should not reward only by ad positive balance', async () => {
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const defaultUser = await userRequestBuilder.buildUser();

        vi.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        });

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const adContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Ad Title',
          status: 'published',
          body: relevantBody,
          type: 'ad',
        });

        await orchestrator.createRate(adContent, 999);

        vi.useRealTimers();

        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -1 });

        const preRewardUser = await userRequestBuilder.get();

        expect.soft(preRewardUser.response.status).toBe(200);
        expect(preRewardUser.responseBody.tabcoins).toBe(999);
        expect(preRewardUser.responseBody.tabcash).toBe(0);

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
        );

        const notRewardedUser = await userRequestBuilder.get();

        expect.soft(notRewardedUser.response.status).toBe(200);
        expect(notRewardedUser.responseBody.tabcoins).toBe(999);
        expect(notRewardedUser.responseBody.tabcash).toBe(0);
      });
    });
  });
});
