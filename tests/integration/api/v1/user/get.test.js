import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import authentication from 'models/authentication';
import orchestrator from 'tests/orchestrator.js';

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

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:session".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"session_id" deve possuir 96 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('session_id');

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"session_id" deve possuir 96 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('session_id');

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"session_id" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('session_id');

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });
  });

  describe('Default user', () => {
    test('With valid session and necessary features', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
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

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});

      const sessionObject = await orchestrator.findSessionByToken(defaultUserSession.token);
      expect(sessionObject).toStrictEqual(defaultUserSession);
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);
      await orchestrator.removeFeaturesFromUser(defaultUser, ['read:session']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para executar esta ação.');
      expect(responseBody.action).toEqual(
        'Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".'
      );
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual(
        'MODEL:AUTHENTICATION:INJECT_AUTHENTICATED_USER:USER_CANT_READ_SESSION'
      );

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet).toStrictEqual({});
    });

    test('With expired session', async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
        advanceTimers: true,
      });

      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      jest.useRealTimers();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(401);
      expect(responseBody.status_code).toEqual(401);
      expect(responseBody.name).toEqual('UnauthorizedError');
      expect(responseBody.message).toEqual('Usuário não possui sessão ativa.');
      expect(responseBody.action).toEqual('Verifique se este usuário está logado.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet.session_id.name).toEqual('session_id');
      expect(parsedCookiesFromGet.session_id.value).toEqual('invalid');
      expect(parsedCookiesFromGet.session_id.maxAge).toEqual(-1);
      expect(parsedCookiesFromGet.session_id.path).toEqual('/');
      expect(parsedCookiesFromGet.session_id.httpOnly).toEqual(true);

      const sessionObject = await orchestrator.findSessionByToken(defaultUserSession.token);
      expect(sessionObject).toBeUndefined();
    });

    describe('Renew Session', () => {
      test('Should be able to renew with token almost expiring', async () => {
        // 29 days, 23 hours and 59 minutes (1 minute left to expire)
        jest.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 + 1000 * 60),
          advanceTimers: true,
        });

        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        jest.useRealTimers();

        const sessionObjectBeforeRenew = await orchestrator.findSessionByToken(defaultUserSession.token);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            cookie: `session_id=${sessionObjectBeforeRenew.token}`,
          },
        });

        const responseBody = await response.json();

        expect(response.status).toBe(200);
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

        const parsedCookiesFromGet = authentication.parseSetCookies(response);
        expect(parsedCookiesFromGet.session_id.name).toEqual('session_id');
        expect(parsedCookiesFromGet.session_id.value).toEqual(sessionObjectBeforeRenew.token);
        expect(parsedCookiesFromGet.session_id.maxAge).toEqual(60 * 60 * 24 * 30);
        expect(parsedCookiesFromGet.session_id.path).toEqual('/');
        expect(parsedCookiesFromGet.session_id.httpOnly).toEqual(true);

        const sessionObjectAfterRenew = await orchestrator.findSessionByToken(defaultUserSession.token);
        expect(sessionObjectBeforeRenew).toStrictEqual(defaultUserSession);
        expect(sessionObjectAfterRenew.id).toEqual(sessionObjectBeforeRenew.id);
        expect(sessionObjectAfterRenew.created_at).toEqual(sessionObjectBeforeRenew.created_at);
        expect(sessionObjectAfterRenew.expires_at > sessionObjectBeforeRenew.expires_at).toEqual(true);
        expect(sessionObjectAfterRenew.updated_at > sessionObjectBeforeRenew.updated_at).toEqual(true);
      });

      test('Should be able to renew with 9 day token', async () => {
        jest.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 days ago
          advanceTimers: true,
        });

        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        jest.useRealTimers();

        const sessionObjectBeforeRenew = await orchestrator.findSessionByToken(defaultUserSession.token);

        expect(sessionObjectBeforeRenew).toStrictEqual(defaultUserSession);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            cookie: `session_id=${sessionObjectBeforeRenew.token}`,
          },
        });

        const responseBody = await response.json();

        expect(response.status).toBe(200);
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

        const parsedCookiesFromGet = authentication.parseSetCookies(response);
        expect(parsedCookiesFromGet.session_id.name).toEqual('session_id');
        expect(parsedCookiesFromGet.session_id.value).toEqual(sessionObjectBeforeRenew.token);
        expect(parsedCookiesFromGet.session_id.maxAge).toEqual(60 * 60 * 24 * 30);
        expect(parsedCookiesFromGet.session_id.path).toEqual('/');
        expect(parsedCookiesFromGet.session_id.httpOnly).toEqual(true);

        const sessionObjectAfterRenew = await orchestrator.findSessionByToken(defaultUserSession.token);
        expect(sessionObjectAfterRenew.id).toEqual(sessionObjectBeforeRenew.id);
        expect(sessionObjectAfterRenew.created_at).toEqual(sessionObjectBeforeRenew.created_at);
        expect(sessionObjectAfterRenew.expires_at > sessionObjectBeforeRenew.expires_at).toEqual(true);
        expect(sessionObjectAfterRenew.updated_at > sessionObjectBeforeRenew.updated_at).toEqual(true);
      });

      test('Should not be able to renew with less than 9 days token', async () => {
        jest.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9 + 1000 * 60), // 1 minute left for 9 days
          advanceTimers: true,
        });

        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        jest.useRealTimers();

        const sessionObjectBeforeRenew = await orchestrator.findSessionByToken(defaultUserSession.token);

        expect(sessionObjectBeforeRenew).toStrictEqual(defaultUserSession);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            cookie: `session_id=${sessionObjectBeforeRenew.token}`,
          },
        });

        const responseBody = await response.json();

        expect(response.status).toBe(200);
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

        const parsedCookiesFromGet = authentication.parseSetCookies(response);
        expect(parsedCookiesFromGet).toStrictEqual({});

        const sessionObjectAfterRenew = await orchestrator.findSessionByToken(defaultUserSession.token);
        expect(sessionObjectAfterRenew).toStrictEqual(sessionObjectBeforeRenew);
      });
    });

    describe('Reward', () => {
      const defaultTestRewardValue = 2;

      test('Should be able to reward the user once a day', async () => {
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);
        await orchestrator.createPrestige(defaultUser.id);

        const preRewardUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            cookie: `session_id=${defaultUserSession.token}`,
          },
        });

        const preRewardUser = await preRewardUserResponse.json();

        expect(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toStrictEqual(0);
        expect(preRewardUser.tabcash).toStrictEqual(0);
        expect(preRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        );

        const rewardUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            cookie: `session_id=${defaultUserSession.token}`,
          },
        });

        const rewardUser = await rewardUserResponse.json();

        expect(rewardUserResponse.status).toBe(200);
        expect(rewardUser.tabcoins).toStrictEqual(defaultTestRewardValue);
        expect(rewardUser.tabcash).toStrictEqual(0);
        expect(rewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());

        const postRewardUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            cookie: `session_id=${defaultUserSession.token}`,
          },
        });

        const postRewardUser = await postRewardUserResponse.json();

        expect(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toStrictEqual(defaultTestRewardValue);
        expect(postRewardUser.tabcash).toStrictEqual(0);
        expect(postRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());
      });

      test('Should deduplicate simultaneous rewards', async () => {
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);
        await orchestrator.createPrestige(defaultUser.id);

        const fetchUser = async () =>
          await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
            method: 'GET',
            headers: {
              cookie: `session_id=${defaultUserSession.token}`,
            },
          });

        const preRewardUserResponse = await fetchUser();
        const preRewardUser = await preRewardUserResponse.json();

        expect(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toStrictEqual(0);
        expect(preRewardUser.tabcash).toStrictEqual(0);
        expect(preRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        );

        const simultaneousResults = await Promise.all([fetchUser(), fetchUser()]);

        const tabcoins = await Promise.all(
          simultaneousResults.map(async (result) => {
            expect(result.status).toBe(200);
            const resultBody = await result.json();
            return resultBody.tabcoins;
          })
        );

        expect(tabcoins).toContain(defaultTestRewardValue);

        const postRewardUserResponse = await fetchUser();

        const postRewardUser = await postRewardUserResponse.json();

        expect(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toStrictEqual(defaultTestRewardValue);
        expect(postRewardUser.tabcash).toStrictEqual(0);
        expect(postRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());
      });

      test('Should not reward if user has no prestige', async () => {
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const fetchUser = async () =>
          await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
            method: 'GET',
            headers: {
              cookie: `session_id=${defaultUserSession.token}`,
            },
          });

        const preRewardUserResponse = await fetchUser();
        const preRewardUser = await preRewardUserResponse.json();

        expect(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toStrictEqual(0);
        expect(preRewardUser.tabcash).toStrictEqual(0);
        expect(preRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        );

        const simultaneousResults = await Promise.all([fetchUser(), fetchUser()]);

        simultaneousResults.forEach(async (result) => {
          expect(result.status).toBe(200);
          const resultBody = await result.json();
          expect(resultBody.tabcoins).toBe(0);
        });

        const postRewardUserResponse = await fetchUser();

        const postRewardUser = await postRewardUserResponse.json();

        expect(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toStrictEqual(0);
        expect(postRewardUser.tabcash).toStrictEqual(0);
        expect(postRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());
      });

      test('Should not reward if user has negative prestige', async () => {
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -1 });

        const fetchUser = async () =>
          await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
            method: 'GET',
            headers: {
              cookie: `session_id=${defaultUserSession.token}`,
            },
          });

        const preRewardUserResponse = await fetchUser();
        const preRewardUser = await preRewardUserResponse.json();

        expect(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toStrictEqual(0);
        expect(preRewardUser.tabcash).toStrictEqual(0);
        expect(preRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        );

        const simultaneousResults = await Promise.all([fetchUser(), fetchUser()]);

        simultaneousResults.forEach(async (result) => {
          expect(result.status).toBe(200);
          const resultBody = await result.json();
          expect(resultBody.tabcoins).toBe(0);
        });

        const postRewardUserResponse = await fetchUser();

        const postRewardUser = await postRewardUserResponse.json();

        expect(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toStrictEqual(0);
        expect(postRewardUser.tabcash).toStrictEqual(0);
        expect(postRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());
      });

      test('Should not reward if user has too many tabcoins', async () => {
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);
        await orchestrator.createPrestige(defaultUser.id);

        await orchestrator.createBalance({
          balanceType: 'user:tabcoin',
          recipientId: defaultUser.id,
          amount: 1000,
        });

        const fetchUser = async () =>
          await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
            method: 'GET',
            headers: {
              cookie: `session_id=${defaultUserSession.token}`,
            },
          });

        const preRewardUserResponse = await fetchUser();
        const preRewardUser = await preRewardUserResponse.json();

        expect(preRewardUserResponse.status).toBe(200);
        expect(preRewardUser.tabcoins).toStrictEqual(1000);
        expect(preRewardUser.tabcash).toStrictEqual(0);
        expect(preRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());

        await orchestrator.updateRewardedAt(
          defaultUser.id,
          new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        );

        const simultaneousResults = await Promise.all([fetchUser(), fetchUser()]);

        simultaneousResults.forEach(async (result) => {
          expect(result.status).toBe(200);
          const resultBody = await result.json();
          expect(resultBody.tabcoins).toBe(1000);
        });

        const postRewardUserResponse = await fetchUser();

        const postRewardUser = await postRewardUserResponse.json();

        expect(postRewardUserResponse.status).toBe(200);
        expect(postRewardUser.tabcoins).toStrictEqual(1000);
        expect(postRewardUser.tabcash).toStrictEqual(0);
        expect(postRewardUser.updated_at).toStrictEqual(defaultUser.updated_at.toISOString());
      });
    });
  });
});
