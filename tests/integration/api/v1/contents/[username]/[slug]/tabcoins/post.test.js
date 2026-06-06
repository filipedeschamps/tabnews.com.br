import { relevantBody } from 'tests/constants-for-tests';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

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

      const tabcoinsRequestBuilder = new RequestBuilder(
        `/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}/tabcoins`,
      );

      const { response, responseBody } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(response.status).toBe(403);

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
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      const tabcoinsRequestBuilder = new RequestBuilder(
        `/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
      );
      await tabcoinsRequestBuilder.buildUser();

      const { response, responseBody } = await tabcoinsRequestBuilder.post({});

      expect.soft(response.status).toBe(400);

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
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      const tabcoinsRequestBuilder = new RequestBuilder(
        `/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
      );
      await tabcoinsRequestBuilder.buildUser();

      const { response, responseBody } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(response.status).toBe(422);

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
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: relevantBody,
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

      const { response: postTabCoinsResponse, responseBody: postTabCoinsResponseBody } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'credit',
        });

      expect.soft(postTabCoinsResponse.status).toBe(201);

      expect(postTabCoinsResponseBody).toStrictEqual({
        tabcoins: 2,
        tabcoins_credit: 1,
        tabcoins_debit: 0,
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(1);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(0);
      expect(secondUserResponseBody.tabcash).toBe(1);
    });

    test('With "transaction_type" set to "debit"', async () => {
      const firstUser = await orchestrator.createUser();
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: relevantBody,
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

      const { response: postTabCoinsResponse, responseBody: postTabCoinsResponseBody } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'debit',
        });

      expect.soft(postTabCoinsResponse.status).toBe(201);

      expect(postTabCoinsResponseBody).toStrictEqual({
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: -1,
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(-1);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(0);
      expect(secondUserResponseBody.tabcash).toBe(1);
    });

    test('With "transaction_type" set to "credit" four times (should be blocked)', async () => {
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
        amount: 8,
      });

      // ROUND 1 OF CREDIT
      const { response: postTabCoinsResponse1 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(postTabCoinsResponse1.status).toBe(201);

      // ROUND 2 OF CREDIT
      const { response: postTabCoinsResponse2 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(postTabCoinsResponse2.status).toBe(201);

      // ROUND 3 OF CREDIT
      const { response: postTabCoinsResponse3 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(postTabCoinsResponse3.status).toBe(201);

      // ROUND 4 OF CREDIT
      const { response: postTabCoinsResponse4, responseBody: postTabCoinsResponse4Body } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'credit',
        });

      expect.soft(postTabCoinsResponse4.status).toBe(400);
      expect(postTabCoinsResponse4Body).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
        action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
        status_code: 400,
        error_id: postTabCoinsResponse4Body.error_id,
        request_id: postTabCoinsResponse4Body.request_id,
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(3);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(2);
      expect(secondUserResponseBody.tabcash).toBe(3);
    });

    test('With "transaction_type" set to "debit" four times (should be blocked)', async () => {
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
        amount: 8,
      });

      // ROUND 1 OF DEBIT
      const { response: postTabCoinsResponse1 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'debit',
      });

      expect.soft(postTabCoinsResponse1.status).toBe(201);

      // ROUND 2 OF DEBIT
      const { response: postTabCoinsResponse2 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'debit',
      });

      expect.soft(postTabCoinsResponse2.status).toBe(201);

      // ROUND 3 OF DEBIT
      const { response: postTabCoinsResponse3 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'debit',
      });

      expect.soft(postTabCoinsResponse3.status).toBe(201);

      // ROUND 4 OF DEBIT
      const { response: postTabCoinsResponse4, responseBody: postTabCoinsResponse4Body } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'debit',
        });

      expect.soft(postTabCoinsResponse4.status).toBe(400);
      expect(postTabCoinsResponse4Body).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
        action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
        status_code: 400,
        error_id: postTabCoinsResponse4Body.error_id,
        request_id: postTabCoinsResponse4Body.request_id,
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(-3);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(2);
      expect(secondUserResponseBody.tabcash).toBe(3);
    });

    test('With "transaction_type" set to "credit" four times from the same user but different IPs (should be blocked)', async () => {
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
        amount: 8,
      });

      // ROUND 1 OF CREDIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.1' });
      const { response: postTabCoinsResponse1 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(postTabCoinsResponse1.status).toBe(201);

      const event1 = await orchestrator.getLastEvent();
      expect(event1.originator_ip).toBe('200.0.0.1');

      // ROUND 2 OF CREDIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.2' });
      const { response: postTabCoinsResponse2 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(postTabCoinsResponse2.status).toBe(201);

      const event2 = await orchestrator.getLastEvent();
      expect(event2.originator_ip).toBe('200.0.0.2');

      // ROUND 3 OF CREDIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.3' });
      const { response: postTabCoinsResponse3 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'credit',
      });

      expect.soft(postTabCoinsResponse3.status).toBe(201);

      const event3 = await orchestrator.getLastEvent();
      expect(event3.originator_ip).toBe('200.0.0.3');

      // ROUND 4 OF CREDIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.4' });
      const { response: postTabCoinsResponse4, responseBody: postTabCoinsResponse4Body } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'credit',
        });

      expect.soft(postTabCoinsResponse4.status).toBe(400);
      expect(postTabCoinsResponse4Body).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
        action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
        status_code: 400,
        error_id: postTabCoinsResponse4Body.error_id,
        request_id: postTabCoinsResponse4Body.request_id,
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(3);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(2);
      expect(secondUserResponseBody.tabcash).toBe(3);
    });

    test('With "transaction_type" set to "debit" four times from the same user but different IPs (should be blocked)', async () => {
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
        amount: 8,
      });

      // ROUND 1 OF DEBIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.1' });
      const { response: postTabCoinsResponse1 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'debit',
      });

      expect.soft(postTabCoinsResponse1.status).toBe(201);

      const event1 = await orchestrator.getLastEvent();
      expect(event1.originator_ip).toBe('200.0.0.1');

      // ROUND 2 OF DEBIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.2' });
      const { response: postTabCoinsResponse2 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'debit',
      });

      expect.soft(postTabCoinsResponse2.status).toBe(201);

      const event2 = await orchestrator.getLastEvent();
      expect(event2.originator_ip).toBe('200.0.0.2');

      // ROUND 3 OF DEBIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.3' });
      const { response: postTabCoinsResponse3 } = await tabcoinsRequestBuilder.post({
        transaction_type: 'debit',
      });

      expect.soft(postTabCoinsResponse3.status).toBe(201);

      const event3 = await orchestrator.getLastEvent();
      expect(event3.originator_ip).toBe('200.0.0.3');

      // ROUND 4 OF DEBIT
      tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': '200.0.0.4' });
      const { response: postTabCoinsResponse4, responseBody: postTabCoinsResponse4Body } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'debit',
        });

      expect.soft(postTabCoinsResponse4.status).toBe(400);
      expect(postTabCoinsResponse4Body).toStrictEqual({
        name: 'ValidationError',
        message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
        action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
        status_code: 400,
        error_id: postTabCoinsResponse4Body.error_id,
        request_id: postTabCoinsResponse4Body.request_id,
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(-3);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(2);
      expect(secondUserResponseBody.tabcash).toBe(3);
    });

    test('With "transaction_type" set to "credit" four times from different users and different IPs (should not be blocked)', async () => {
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

      const voterIps = ['200.0.0.1', '200.0.0.2', '200.0.0.3', '200.0.0.4'];
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');

      for (const [index, ip] of voterIps.entries()) {
        const voter = await tabcoinsRequestBuilder.buildUser();

        await orchestrator.createBalance({
          balanceType: 'user:tabcoin',
          recipientId: voter.id,
          amount: 2,
        });

        tabcoinsRequestBuilder.buildHeaders({ 'x-forwarded-for': ip });

        const { response: postTabCoinsResponse, responseBody: postTabCoinsResponseBody } =
          await tabcoinsRequestBuilder.post({
            transaction_type: 'credit',
          });

        expect.soft(postTabCoinsResponse.status).toBe(201);
        expect(postTabCoinsResponseBody).toStrictEqual({
          tabcoins: index + 1,
          tabcoins_credit: index + 1,
          tabcoins_debit: 0,
        });

        const createdEvent = await orchestrator.getLastEvent();
        expect(createdEvent.originator_ip).toBe(ip);

        const { responseBody: voterResponseBody } = await usersRequestBuilder.get(`/${voter.username}`);

        expect(voterResponseBody.tabcoins).toBe(0);
        expect(voterResponseBody.tabcash).toBe(1);
      }

      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(4);
      expect(firstUserResponseBody.tabcash).toBe(0);
    });

    test('With "transaction_type" set to "debit" twice to make content "tabcoins" negative', async () => {
      const firstUser = await orchestrator.createUser();
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: relevantBody,
        status: 'published',
      });

      const tabcoinsRequestBuilder = new RequestBuilder(
        `/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
      );
      const secondUser = await tabcoinsRequestBuilder.buildUser();

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 4,
      });

      // ROUND 1 OF DEBIT
      const { response: postTabCoinsResponse1, responseBody: postTabCoinsResponse1Body } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'debit',
        });

      expect.soft(postTabCoinsResponse1.status).toBe(201);

      expect(postTabCoinsResponse1Body).toStrictEqual({
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: -1,
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponse1Body } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponse1Body.tabcoins).toBe(-1);
      expect(firstUserResponse1Body.tabcash).toBe(0);

      const { responseBody: secondUserResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponse1Body.tabcoins).toBe(2);
      expect(secondUserResponse1Body.tabcash).toBe(1);

      // ROUND 2 OF DEBIT
      const { response: postTabCoinsResponse2, responseBody: postTabCoinsResponse2Body } =
        await tabcoinsRequestBuilder.post({
          transaction_type: 'debit',
        });

      expect.soft(postTabCoinsResponse2.status).toBe(201);

      expect(postTabCoinsResponse2Body).toStrictEqual({
        tabcoins: -1,
        tabcoins_credit: 0,
        tabcoins_debit: -2,
      });

      const { responseBody: firstUserResponse2Body } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponse2Body.tabcoins).toBe(-2);
      expect(firstUserResponse2Body.tabcash).toBe(0);

      const { responseBody: secondUserResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponse2Body.tabcoins).toBe(0);
      expect(secondUserResponse2Body.tabcash).toBe(2);
    });

    test('With 20 simultaneous posts, but enough TabCoins for 1', async () => {
      const timesToFetch = 20;
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

      const postTabCoinsPromises = Array(timesToFetch)
        .fill()
        .map(() => tabcoinsRequestBuilder.post({ transaction_type: 'credit' }));

      const postTabCoinsResponses = await Promise.all(postTabCoinsPromises);

      const postTabCoinsResponsesBody = postTabCoinsResponses.map(({ responseBody }) => responseBody);

      const postTabCoinsResponsesStatus = postTabCoinsResponses.map(({ response }) => response.status);

      const successPostIndex1 = postTabCoinsResponsesStatus.indexOf(201);
      const successPostIndex2 = postTabCoinsResponsesStatus.indexOf(201, successPostIndex1 + 1);

      expect(successPostIndex1).not.toBe(-1);
      expect(successPostIndex2).toBe(-1);
      expect(postTabCoinsResponsesStatus[successPostIndex1]).toBe(201);

      expect(postTabCoinsResponsesBody[successPostIndex1]).toStrictEqual({
        tabcoins: 1,
        tabcoins_credit: 1,
        tabcoins_debit: 0,
      });

      postTabCoinsResponsesStatus.splice(successPostIndex1, 1);
      postTabCoinsResponsesBody.splice(successPostIndex1, 1);

      postTabCoinsResponsesStatus.forEach((status) => expect.soft(status).toBe(422));

      expect(postTabCoinsResponsesBody).toContainEqual({
        name: 'UnprocessableEntityError',
        message: 'Não foi possível adicionar TabCoins nesta publicação.',
        action: 'Você precisa de pelo menos 2 TabCoins para realizar esta ação.',
        status_code: 422,
        error_id: postTabCoinsResponsesBody[timesToFetch - 2].error_id,
        request_id: postTabCoinsResponsesBody[timesToFetch - 2].request_id,
        error_location_code: 'MODEL:BALANCE:RATE_CONTENT:NOT_ENOUGH',
      });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(1);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(0);
      expect(secondUserResponseBody.tabcash).toBe(1);
    });

    test('With 100 simultaneous posts from the same user, but enough TabCoins for 3', async () => {
      const timesToFetch = 100;
      const timesSuccessfully = 3;

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
        amount: 2 * timesSuccessfully,
      });

      const postTabCoinsResponses = await Promise.all(
        Array.from({ length: timesToFetch }, () => tabcoinsRequestBuilder.post({ transaction_type: 'credit' })),
      );

      const successfulResponsesStatus = postTabCoinsResponses
        .map(({ response }) => response.status)
        .filter((status) => status === 201);

      expect(successfulResponsesStatus).toHaveLength(timesSuccessfully);

      postTabCoinsResponses
        .filter(({ response }) => response.status !== 201)
        .forEach(({ response, responseBody }) => {
          if (response.status === 400) {
            expect(responseBody).toStrictEqual({
              name: 'ValidationError',
              message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
              action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
              status_code: 400,
              error_id: responseBody.error_id,
              request_id: responseBody.request_id,
            });
          } else {
            expect.soft(response.status).toBe(422);
            expect(responseBody).toStrictEqual({
              name: 'UnprocessableEntityError',
              message: 'Não foi possível adicionar TabCoins nesta publicação.',
              action: 'Você precisa de pelo menos 2 TabCoins para realizar esta ação.',
              status_code: 422,
              error_id: responseBody.error_id,
              request_id: responseBody.request_id,
              error_location_code: 'MODEL:BALANCE:RATE_CONTENT:NOT_ENOUGH',
            });
          }
        });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(timesSuccessfully);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(0);
      expect(secondUserResponseBody.tabcash).toBe(timesSuccessfully);
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    test.skip('With 10 simultaneous posts from the same user, and enough TabCoins for more than the rate limit', async () => {
      const timesToFetch = 10;
      const rateLimit = 3;

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
        amount: 2 * timesToFetch,
      });

      const postTabCoinsResponses = await Promise.all(
        Array.from({ length: timesToFetch }, () => tabcoinsRequestBuilder.post({ transaction_type: 'credit' })),
      );

      const successfulResponsesStatus = postTabCoinsResponses
        .map(({ response }) => response.status)
        .filter((status) => status === 201);

      expect(successfulResponsesStatus).toHaveLength(rateLimit);

      postTabCoinsResponses
        .filter(({ response }) => response.status !== 201)
        .forEach(({ response, responseBody }) => {
          if (response.status === 400) {
            expect(responseBody).toStrictEqual({
              name: 'ValidationError',
              message: 'Você está tentando qualificar muitas vezes o mesmo conteúdo.',
              action: 'Esta operação não poderá ser repetida dentro de 72 horas.',
              status_code: 400,
              error_id: responseBody.error_id,
              request_id: responseBody.request_id,
            });
          } else {
            expect.soft(response.status).toBe(422);
            expect(responseBody).toStrictEqual({
              name: 'UnprocessableEntityError',
              message: 'Muitos votos ao mesmo tempo.',
              action: 'Tente realizar esta operação mais tarde.',
              status_code: 422,
              error_id: responseBody.error_id,
              request_id: responseBody.request_id,
              error_location_code: 'CONTROLLER:CONTENT:TABCOINS:SERIALIZATION_FAILURE',
            });
          }
        });

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const { responseBody: firstUserResponseBody } = await usersRequestBuilder.get(`/${firstUser.username}`);

      expect(firstUserResponseBody.tabcoins).toBe(rateLimit);
      expect(firstUserResponseBody.tabcash).toBe(0);

      const { responseBody: secondUserResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

      expect(secondUserResponseBody.tabcoins).toBe(2 * timesToFetch - 2 * rateLimit);
      expect(secondUserResponseBody.tabcash).toBe(rateLimit);
    });

    test('With 100 simultaneous posts from different users and IPs, but only responses 201 or 422', async () => {
      const timesToFetch = 100;

      const firstUser = await orchestrator.createUser();
      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body',
        status: 'published',
      });

      const tabcoinsUrl = `/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`;

      const requestBuilders = await Promise.all(
        Array.from({ length: timesToFetch }, async (_, index) => {
          const requestBuilder = new RequestBuilder(tabcoinsUrl);
          const voter = await requestBuilder.buildUser();
          requestBuilder.buildHeaders({ 'x-forwarded-for': `10.0.${Math.floor(index / 256)}.${index % 256}` });

          await orchestrator.createBalance({
            balanceType: 'user:tabcoin',
            recipientId: voter.id,
            amount: 2,
          });

          return requestBuilder;
        }),
      );

      const postTabCoinsResponses = await Promise.all(
        requestBuilders.map((requestBuilder) => requestBuilder.post({ transaction_type: 'credit' })),
      );

      const blockedResponses = postTabCoinsResponses.filter(({ response }) => response.status !== 201);

      expect(blockedResponses.length).toBeGreaterThan(0);

      blockedResponses.forEach(({ response, responseBody }) => {
        expect.soft(response.status).toBe(422);
        expect(responseBody).toStrictEqual({
          name: 'UnprocessableEntityError',
          message: 'Muitos votos ao mesmo tempo.',
          action: 'Tente realizar esta operação mais tarde.',
          status_code: 422,
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
          error_location_code: 'CONTROLLER:CONTENT:TABCOINS:SERIALIZATION_FAILURE',
        });
      });
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    test.skip('With simultaneous posts on different contents from different users (should not block each other)', async () => {
      const timesToFetch = 10;

      const requestBuilders = await Promise.all(
        Array.from({ length: timesToFetch }, async (_, index) => {
          const contentOwner = await orchestrator.createUser();
          const content = await orchestrator.createContent({
            owner_id: contentOwner.id,
            title: `Content ${index}`,
            body: 'Body',
            status: 'published',
          });

          const requestBuilder = new RequestBuilder(
            `/api/v1/contents/${contentOwner.username}/${content.slug}/tabcoins`,
          );
          const voter = await requestBuilder.buildUser();
          requestBuilder.buildHeaders({ 'x-forwarded-for': `10.0.0.${index + 1}` });

          await orchestrator.createBalance({
            balanceType: 'user:tabcoin',
            recipientId: voter.id,
            amount: 2,
          });

          return requestBuilder;
        }),
      );

      const postTabCoinsResponses = await Promise.all(
        requestBuilders.map((requestBuilder) => requestBuilder.post({ transaction_type: 'credit' })),
      );

      const statuses = postTabCoinsResponses.map(({ response }) => response.status);

      expect(statuses).toStrictEqual(Array(timesToFetch).fill(201));
    });
  });
});
