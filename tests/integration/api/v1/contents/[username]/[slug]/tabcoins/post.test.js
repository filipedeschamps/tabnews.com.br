import fetch from 'cross-fetch';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/contents/tabcoins', () => {
  describe('Anonymous user', () => {
    test('Not logged in', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Title',
        body: 'Body',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_type: 'credit',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "update:content".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });
    });
  });

  describe('Default user', () => {
    test('With no "transaction_type"', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"transaction_type" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'transaction_type',
        type: 'any.required',
      });
    });

    test('With not enough TabCoins', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'credit',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toBe(422);

      expect(responseBody).toStrictEqual({
        name: 'UnprocessableEntityError',
        message: 'Não foi possível adicionar TabCoins nesta publicação.',
        action: 'Você precisa de pelo menos 2 TabCoins para realizar esta ação.',
        status_code: 422,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:BALANCE:RATE_CONTENT:NOT_ENOUGH',
      });
    });

    test('With "transaction_type" set to "credit"', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 2,
      });

      const postTabCoinsResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'credit',
          }),
        }
      );

      const postTabCoinsResponseBody = await postTabCoinsResponse.json();

      expect(postTabCoinsResponse.status).toBe(201);

      expect(postTabCoinsResponseBody).toStrictEqual({
        tabcoins: 2,
      });

      const firstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponseBody = await firstUserResponse.json();

      expect(firstUserResponseBody.tabcoins).toStrictEqual(6);
      expect(firstUserResponseBody.tabcash).toStrictEqual(0);

      const secondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserResponseBody = await secondUserResponse.json();

      expect(secondUserResponseBody.tabcoins).toStrictEqual(0);
      expect(secondUserResponseBody.tabcash).toStrictEqual(1);
    });

    test('With "transaction_type" set to "debit"', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 2,
      });

      const postTabCoinsResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'debit',
          }),
        }
      );

      const postTabCoinsResponseBody = await postTabCoinsResponse.json();

      expect(postTabCoinsResponse.status).toBe(201);

      expect(postTabCoinsResponseBody).toStrictEqual({
        tabcoins: 0,
      });

      const firstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponseBody = await firstUserResponse.json();

      expect(firstUserResponseBody.tabcoins).toStrictEqual(4);
      expect(firstUserResponseBody.tabcash).toStrictEqual(0);

      const secondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserResponseBody = await secondUserResponse.json();

      expect(secondUserResponseBody.tabcoins).toStrictEqual(0);
      expect(secondUserResponseBody.tabcash).toStrictEqual(1);
    });

    test('With "transaction_type" set to "debit" twice to make content "tabcoins" negative', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 4,
      });

      // ROUND 1 OF DEBIT
      const postTabCoinsResponse1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'debit',
          }),
        }
      );

      const postTabCoinsResponse1Body = await postTabCoinsResponse1.json();

      expect(postTabCoinsResponse1.status).toBe(201);

      expect(postTabCoinsResponse1Body).toStrictEqual({
        tabcoins: 0,
      });

      const firstUserResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponse1Body = await firstUserResponse1.json();

      expect(firstUserResponse1Body.tabcoins).toStrictEqual(4);
      expect(firstUserResponse1Body.tabcash).toStrictEqual(0);

      const secondUserResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserResponse1Body = await secondUserResponse1.json();

      expect(secondUserResponse1Body.tabcoins).toStrictEqual(2);
      expect(secondUserResponse1Body.tabcash).toStrictEqual(1);

      // ROUND 2 OF DEBIT
      const postTabCoinsResponse2 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'debit',
          }),
        }
      );

      const postTabCoinsResponse2Body = await postTabCoinsResponse2.json();

      expect(postTabCoinsResponse2.status).toBe(201);

      expect(postTabCoinsResponse2Body).toStrictEqual({
        tabcoins: -1,
      });

      const firstUserResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponse2Body = await firstUserResponse2.json();

      expect(firstUserResponse2Body.tabcoins).toStrictEqual(3);
      expect(firstUserResponse2Body.tabcash).toStrictEqual(0);

      const secondUserResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserResponse2Body = await secondUserResponse2.json();

      expect(secondUserResponse2Body.tabcoins).toStrictEqual(0);
      expect(secondUserResponse2Body.tabcash).toStrictEqual(2);
    });
  });
});
