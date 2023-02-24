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
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
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
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
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
        error_location_code: 'MODEL:BALANCE:RATE_CONTENT:NOT_ENOUGH',
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

      expect(firstUserResponseBody.tabcoins).toStrictEqual(3);
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

      expect(firstUserResponseBody.tabcoins).toStrictEqual(1);
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

    test('With "transaction_type" set to "credit" twice (should be blocked)', async () => {
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

      // ROUND 1 OF CREDIT
      const postTabCoinsResponse1 = await fetch(
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

      expect(postTabCoinsResponse1.status).toBe(201);

      // ROUND 2 OF CREDIT
      const postTabCoinsResponse2 = await fetch(
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

      const postTabCoinsResponse2Body = await postTabCoinsResponse2.json();

      expect(postTabCoinsResponse2.status).toBe(400);
      expect(postTabCoinsResponse2Body).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
        action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
        status_code: 400,
        error_id: postTabCoinsResponse2Body.error_id,
        request_id: postTabCoinsResponse2Body.request_id,
      });

      const firstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponseBody = await firstUserResponse.json();

      expect(firstUserResponseBody.tabcoins).toStrictEqual(3);
      expect(firstUserResponseBody.tabcash).toStrictEqual(0);

      const secondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserResponseBody = await secondUserResponse.json();

      expect(secondUserResponseBody.tabcoins).toStrictEqual(2);
      expect(secondUserResponseBody.tabcash).toStrictEqual(1);
    });

    test('With "transaction_type" set to "debit" twice (should be blocked)', async () => {
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

      expect(postTabCoinsResponse1.status).toBe(201);

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

      expect(postTabCoinsResponse2.status).toBe(400);
      expect(postTabCoinsResponse2Body).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
        action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
        status_code: 400,
        error_id: postTabCoinsResponse2Body.error_id,
        request_id: postTabCoinsResponse2Body.request_id,
      });

      const firstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponseBody = await firstUserResponse.json();

      expect(firstUserResponseBody.tabcoins).toStrictEqual(1);
      expect(firstUserResponseBody.tabcash).toStrictEqual(0);

      const secondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserResponseBody = await secondUserResponse.json();

      expect(secondUserResponseBody.tabcoins).toStrictEqual(2);
      expect(secondUserResponseBody.tabcash).toStrictEqual(1);
    });

    // This tests are beign temporarly skipped because of the new feature of not allowing
    // to credit/debit twice the same content. This feature is just a temporary test
    // to a more sofisticated feature that will be implemented in the future.

    test.skip('With "transaction_type" set to "debit" twice to make content "tabcoins" negative', async () => {
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

      expect(firstUserResponse1Body.tabcoins).toStrictEqual(1);
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

      expect(firstUserResponse2Body.tabcoins).toStrictEqual(0);
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

    test.skip('With 20 simultaneous posts, but enough TabCoins for 1', async () => {
      const timesToFetch = 20;
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

      const postTabCoinsPromises = Array(timesToFetch)
        .fill()
        .map(() =>
          fetch(
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
          )
        );

      const postTabCoinsResponses = await Promise.all(postTabCoinsPromises);

      const postTabCoinsResponsesBodyPromises = postTabCoinsResponses.map((postTabCoinsResponse) =>
        postTabCoinsResponse.json()
      );

      const postTabCoinsResponsesStatus = postTabCoinsResponses.map(
        (postTabCoinsResponse) => postTabCoinsResponse.status
      );

      const postTabCoinsResponsesBody = await Promise.all(postTabCoinsResponsesBodyPromises);

      const successPostIndex1 = postTabCoinsResponsesStatus.indexOf(201);
      const successPostIndex2 = postTabCoinsResponsesStatus.indexOf(201, successPostIndex1 + 1);

      expect(successPostIndex1).not.toEqual(-1);
      expect(successPostIndex2).toEqual(-1);
      expect(postTabCoinsResponsesStatus[successPostIndex1]).toEqual(201);

      expect(postTabCoinsResponsesBody[successPostIndex1]).toStrictEqual({
        tabcoins: 2,
      });

      postTabCoinsResponsesStatus.splice(successPostIndex1, 1);
      postTabCoinsResponsesBody.splice(successPostIndex1, 1);

      postTabCoinsResponsesStatus.forEach((status) => expect(status).toEqual(422));

      expect(postTabCoinsResponsesBody).toContainEqual({
        name: 'UnprocessableEntityError',
        message: 'Não foi possível adicionar TabCoins nesta publicação.',
        action: 'Você precisa de pelo menos 2 TabCoins para realizar esta ação.',
        status_code: 422,
        error_id: postTabCoinsResponsesBody[timesToFetch - 2].error_id,
        request_id: postTabCoinsResponsesBody[timesToFetch - 2].request_id,
        error_location_code: 'MODEL:BALANCE:RATE_CONTENT:NOT_ENOUGH',
      });

      const firstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponseBody = await firstUserResponse.json();

      expect(firstUserResponseBody.tabcoins).toStrictEqual(3);
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

    test.skip('With 100 simultaneous posts, but enough TabCoins for 6', async () => {
      const timesToFetch = 100;
      const timesSuccessfully = 6;

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
        amount: 2 * timesSuccessfully,
      });

      const postTabCoinsPromises = Array(timesToFetch)
        .fill()
        .map(() =>
          fetch(
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
          )
        );

      const postTabCoinsResponses = await Promise.all(postTabCoinsPromises);

      const postTabCoinsResponsesBodyPromises = postTabCoinsResponses.map((postTabCoinsResponse) =>
        postTabCoinsResponse.json()
      );

      const postTabCoinsResponsesStatus = postTabCoinsResponses.map(
        (postTabCoinsResponse) => postTabCoinsResponse.status
      );

      const postTabCoinsResponsesBody = await Promise.all(postTabCoinsResponsesBodyPromises);

      let successPostIndexes = [postTabCoinsResponsesStatus.indexOf(201)];

      for (let i = 0; i < timesSuccessfully; i++) {
        successPostIndexes.push(postTabCoinsResponsesStatus.indexOf(201, successPostIndexes[i] + 1));
        expect(successPostIndexes[i]).not.toEqual(-1);
        expect(postTabCoinsResponsesStatus[successPostIndexes[i]]).toEqual(201);
        expect(postTabCoinsResponsesBody).toContainEqual({
          tabcoins: 2 + i,
        });
      }

      expect(successPostIndexes[timesSuccessfully]).toEqual(-1);

      successPostIndexes.splice(-1, 1);
      successPostIndexes.reverse();

      successPostIndexes.forEach((idx) => {
        postTabCoinsResponsesStatus.splice(idx, 1);
        postTabCoinsResponsesBody.splice(idx, 1);
      });

      postTabCoinsResponsesStatus.forEach((status) => expect(status).toEqual(422));

      postTabCoinsResponsesBody.forEach((responseBody) =>
        expect(responseBody).toStrictEqual({
          name: 'UnprocessableEntityError',
          message: 'Não foi possível adicionar TabCoins nesta publicação.',
          action: 'Você precisa de pelo menos 2 TabCoins para realizar esta ação.',
          status_code: 422,
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
          error_location_code: 'MODEL:BALANCE:RATE_CONTENT:NOT_ENOUGH',
        })
      );

      const firstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserResponseBody = await firstUserResponse.json();

      expect(firstUserResponseBody.tabcoins).toStrictEqual(2 + timesSuccessfully);
      expect(firstUserResponseBody.tabcash).toStrictEqual(0);

      const secondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserResponseBody = await secondUserResponse.json();

      expect(secondUserResponseBody.tabcoins).toStrictEqual(0);
      expect(secondUserResponseBody.tabcash).toStrictEqual(timesSuccessfully);
    });

    test.skip('With 100 simultaneous posts, enough TabCoins for 90, no db resources, but only responses 201 or 422', async () => {
      const timesToFetch = 100;
      const timesSuccessfully = 90;

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
        amount: 2 * timesSuccessfully,
      });

      const postTabCoinsPromises = Array(timesToFetch)
        .fill()
        .map(() =>
          fetch(
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
          )
        );

      const postTabCoinsResponses = await Promise.all(postTabCoinsPromises);

      const postTabCoinsResponsesBodyPromises = postTabCoinsResponses.map((postTabCoinsResponse) =>
        postTabCoinsResponse.json()
      );

      const postTabCoinsResponsesStatus = postTabCoinsResponses.map(
        (postTabCoinsResponse) => postTabCoinsResponse.status
      );

      const postTabCoinsResponsesBody = await Promise.all(postTabCoinsResponsesBodyPromises);

      expect([201, 422]).toEqual(expect.arrayContaining(postTabCoinsResponsesStatus));

      expect(postTabCoinsResponsesBody).toContainEqual(
        expect.objectContaining({
          name: 'UnprocessableEntityError',
          message: 'Muitos votos ao mesmo tempo.',
          action: 'Tente realizar esta operação mais tarde.',
          status_code: 422,
          error_location_code: 'CONTROLLER:CONTENT:TABCOINS:SERIALIZATION_FAILURE',
        })
      );
    });
  });
});
