import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import { RequestBuilder } from 'tests/builders';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/user', () => {
  describe('Anonymous user', () => {
    test('Retrieving the endpoint', async () => {
      const builder = await RequestBuilder.create({
        url: '/user',
      }).call();

      const expectedBody = {
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:session".',
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      };

      builder.expectResponseBody(expectedBody);
      builder.expectResponseStatus(403);
      builder.expectResponseCookie({});

      expect(uuidVersion(builder.response.body.error_id)).toEqual(4);
      expect(uuidVersion(builder.response.body.request_id)).toEqual(4);
    });

    test('Retrieving the endpoint with malformatted "session_id" (too short)', async () => {
      const builder = await RequestBuilder.create({
        url: '/user',
        headers: {
          cookie: `session_id=tooshort`,
        },
      }).call();

      const expectedBody = {
        status_code: 400,
        name: 'ValidationError',
        message: '"session_id" deve possuir 96 caracteres.',
        action: 'Ajuste os dados enviados e tente novamente.',
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'session_id',
      };

      builder.expectResponseBody(expectedBody);
      builder.expectResponseStatus(400);
      builder.expectResponseCookie({});

      expect(uuidVersion(builder.response.body.error_id)).toEqual(4);
      expect(uuidVersion(builder.response.body.request_id)).toEqual(4);
    });

    test('Retrieving the endpoint with malformatted "session_id" (too long)', async () => {
      const builder = await RequestBuilder.create({
        url: '/user',
        headers: {
          cookie: `session_id=97characterslongggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg`,
        },
      }).call();

      const expectedBody = {
        status_code: 400,
        name: 'ValidationError',
        message: '"session_id" deve possuir 96 caracteres.',
        action: 'Ajuste os dados enviados e tente novamente.',
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'session_id',
      };

      builder.expectResponseBody(expectedBody);
      builder.expectResponseStatus(400);
      builder.expectResponseCookie({});

      expect(uuidVersion(builder.response.body.error_id)).toEqual(4);
      expect(uuidVersion(builder.response.body.request_id)).toEqual(4);
    });

    test('Retrieving the endpoint with correct length "session_id", but with invalid characters', async () => {
      const builder = await RequestBuilder.create({
        url: '/user',
        headers: {
          cookie: `session_id=%208427a9as213d2a80da05b25c76b43fa539ec09303fb7ea146ba661208c1a475ed0d91847f16123d257c858994e4aaf8`,
        },
      }).call();

      const expectedBody = {
        status_code: 400,
        name: 'ValidationError',
        message: '"session_id" deve conter apenas caracteres alfanuméricos.',
        action: 'Ajuste os dados enviados e tente novamente.',
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'session_id',
      };

      builder.expectResponseBody(expectedBody);
      builder.expectResponseStatus(400);
      builder.expectResponseCookie({});

      expect(uuidVersion(builder.response.body.error_id)).toEqual(4);
      expect(uuidVersion(builder.response.body.request_id)).toEqual(4);
    });
  });

  describe('Default user', () => {
    test('With valid session and necessary features', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const builder = await RequestBuilder.create({
        url: '/user',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
      }).call();

      const expectedBody = {
        id: defaultUser.id,
        username: defaultUser.username,
        email: defaultUser.email,
        notifications: defaultUser.notifications,
        features: defaultUser.features,
        tabcoins: defaultUser.tabcoins,
        tabcash: defaultUser.tabcash,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: defaultUser.updated_at.toISOString(),
      };

      builder.expectResponseBody(expectedBody);
      builder.expectResponseStatus(200);
      builder.expectResponseCookie({});

      const sessionObject = await orchestrator.findSessionByToken(defaultUserSession.token);
      expect(sessionObject).toStrictEqual(defaultUserSession);
    });

    test('With valid session, but user lost "read:session" feature', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);
      await orchestrator.removeFeaturesFromUser(defaultUser, ['read:session']);

      const builder = await RequestBuilder.create({
        url: '/user',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      }).call();

      const expectedBody = {
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Você não possui permissão para executar esta ação.',
        action: 'Verifique se este usuário já ativou a sua conta e recebeu a feature "read:session".',
        error_location_code: 'MODEL:AUTHENTICATION:INJECT_AUTHENTICATED_USER:USER_CANT_READ_SESSION',
      };

      builder.expectResponseBody(expectedBody);
      builder.expectResponseStatus(403);
      builder.expectResponseCookie({});

      expect(uuidVersion(builder.response.body.error_id)).toEqual(4);
      expect(uuidVersion(builder.response.body.request_id)).toEqual(4);
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

      const builder = await RequestBuilder.create({
        url: '/user',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
      }).call();

      const expectedBody = {
        status_code: 401,
        name: 'UnauthorizedError',
        message: 'Usuário não possui sessão ativa.',
        action: 'Verifique se este usuário está logado.',
      };
      const expectedCookie = {
        session_id: {
          name: 'session_id',
          value: 'invalid',
          maxAge: -1,
          path: '/',
          httpOnly: true,
        },
      };

      builder.expectResponseBody(expectedBody);
      builder.expectResponseStatus(401);
      builder.expectResponseCookie(expectedCookie, true);

      expect(uuidVersion(builder.response.body.error_id)).toEqual(4);
      expect(uuidVersion(builder.response.body.request_id)).toEqual(4);

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

        const builder = await RequestBuilder.create({
          url: '/user',
          headers: {
            cookie: `session_id=${sessionObjectBeforeRenew.token}`,
          },
        }).call();

        const expectedBody = {
          id: defaultUser.id,
          username: defaultUser.username,
          email: defaultUser.email,
          notifications: defaultUser.notifications,
          features: defaultUser.features,
          tabcoins: defaultUser.tabcoins,
          tabcash: defaultUser.tabcash,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: defaultUser.updated_at.toISOString(),
        };
        const expectedCookie = {
          session_id: {
            name: 'session_id',
            value: sessionObjectBeforeRenew.token,
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
            httpOnly: true,
          },
        };

        builder.expectResponseBody(expectedBody, true);
        builder.expectResponseStatus(200);
        builder.expectResponseCookie(expectedCookie, true);

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

        const builder = await RequestBuilder.create({
          url: '/user',
          headers: {
            cookie: `session_id=${sessionObjectBeforeRenew.token}`,
          },
        }).call();

        const expectedBody = {
          id: defaultUser.id,
          username: defaultUser.username,
          email: defaultUser.email,
          notifications: defaultUser.notifications,
          features: defaultUser.features,
          tabcoins: defaultUser.tabcoins,
          tabcash: defaultUser.tabcash,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: defaultUser.updated_at.toISOString(),
        };

        const expectedCookie = {
          session_id: {
            name: 'session_id',
            value: sessionObjectBeforeRenew.token,
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
            httpOnly: true,
          },
        };

        builder.expectResponseBody(expectedBody, true);
        builder.expectResponseStatus(200);
        builder.expectResponseCookie(expectedCookie, true);

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

        const builder = await RequestBuilder.create({
          url: '/user',
          headers: {
            cookie: `session_id=${sessionObjectBeforeRenew.token}`,
          },
        }).call();

        const expectedBody = {
          id: defaultUser.id,
          username: defaultUser.username,
          email: defaultUser.email,
          notifications: defaultUser.notifications,
          features: defaultUser.features,
          tabcoins: defaultUser.tabcoins,
          tabcash: defaultUser.tabcash,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: defaultUser.updated_at.toISOString(),
        };
        const expectedCookie = {};

        builder.expectResponseBody(expectedBody, true);
        builder.expectResponseStatus(200);
        builder.expectResponseCookie(expectedCookie);

        const sessionObjectAfterRenew = await orchestrator.findSessionByToken(defaultUserSession.token);
        expect(sessionObjectAfterRenew).toStrictEqual(sessionObjectBeforeRenew);
      });
    });
  });
});
