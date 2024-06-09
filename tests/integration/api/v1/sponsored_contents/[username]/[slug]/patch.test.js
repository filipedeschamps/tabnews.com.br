import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/contents/[username]/[slug]', () => {
  describe('Anonymous user', () => {
    test('A non-existent sponsored content', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch('/someUsername/slug', {
        title: 'Title',
        deactivate_at: new Date(),
      });

      expect(response.status).toEqual(403);
      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "update:sponsored_content".',
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('User without "update:sponsored_content" feature', () => {
    test('A non-existent sponsored content', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const userWithoutFeature = await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${userWithoutFeature.username}/slug`,
        {
          body: 'Body.',
          deactivate_at: new Date(),
        },
      );

      expect(response.status).toEqual(403);
      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "update:sponsored_content".',
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('User with "update:sponsored_content" feature', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });

    test('With a "username" that does not exist', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(`/ThisUserDoesNotExists/slug`, {
        title: 'New title',
      });

      expect(response.status).toEqual(404);
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: 'O "username" informado não foi encontrado no sistema.',
        action: 'Verifique se o "username" está digitado corretamente.',
        error_location_code: 'MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND',
        key: 'username',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With a "slug" that does not exist', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const firstUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'First user content',
        status: 'published',
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${firstUser.username}/something`,
        {
          body: 'Will not find',
        },
      );

      expect(response.status).toEqual(404);
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: 'A publicação patrocinada informada não foi encontrada no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        key: 'slug',
        error_location_code: 'CONTROLLER:SPONSORED_CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Updating a child of a sponsored content', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: firstUser.id,
        amount: 10,
      });

      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const secondUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: firstUser.id,
        title: 'Sponsored content title',
        body: 'Body',
        tabcash: 10,
        source_url: 'https://example.com',
      });
      await orchestrator.createContent({
        owner_id: secondUser.id,
        parent_id: createdSponsoredContent.content_id,
        title: 'Child level 1',
        status: 'published',
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${secondUser.username}/${secondUser.slug}`,
        { body: 'New body' },
      );

      expect(response.status).toEqual(404);
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: 'A publicação patrocinada informada não foi encontrada no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        error_location_code: 'CONTROLLER:SPONSORED_CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Updating a field that cannot be updated', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Sponsored content title',
        tabcash: 50,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { status: 'published' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Objeto enviado deve ter no mínimo uma chave.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'object',
        type: 'object.min',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Updating a deactivated sponsored content', async () => {
      vi.useFakeTimers({
        now: new Date('2024-06-01T00:00:00.000Z'),
      });

      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Sponsored content title',
        tabcash: 50,
        deactivate_at: new Date('2024-06-05T00:00:00.000Z'),
      });

      vi.useRealTimers();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { title: 'New title' },
      );

      expect(response.status).toEqual(404);
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: 'A publicação patrocinada informada não foi encontrada no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        error_location_code: 'CONTROLLER:SPONSORED_CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
    });

    test('Updating "deactivate_at" with a date in the future', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "deactivate_at"',
        tabcash: 50,
      });

      const deactivate_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { deactivate_at: deactivate_at },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: createdSponsoredContent.slug,
        title: createdSponsoredContent.title,
        body: createdSponsoredContent.body,
        source_url: null,
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: deactivate_at.toISOString(),
        tabcoins: 1,
        tabcash: 50,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > createdSponsoredContent.updated_at.toISOString()).toEqual(true);
    });

    test('Updating "deactivate_at" with a date in the past', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "deactivate_at"',
        tabcash: 50,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { deactivate_at: new Date() },
      );

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"deactivate_at" não pode ser no passado.',
        action: 'Utilize uma data "deactivate_at" no futuro.',
        error_location_code: 'MODEL:SPONSORED_CONTENT:VALIDATE_DEACTIVATE_AT:DATE_IN_PAST',
        key: 'deactivate_at',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
    });

    test('Updating "body"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 10,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "body"',
        body: 'Original body',
        tabcash: 10,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { body: 'New body' },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: createdSponsoredContent.slug,
        title: createdSponsoredContent.title,
        body: 'New body',
        source_url: null,
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: null,
        tabcoins: 1,
        tabcash: 10,
        owner_username: defaultUser.username,
      });

      expect(responseBody.updated_at > createdSponsoredContent.updated_at.toISOString()).toEqual(true);
    });

    test('Updating "slug" containing more than 226 bytes', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 10,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "slug"',
        tabcash: 10,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { slug: 'this-slug-must-be-changed-from-227-to-226-bytes'.padEnd(227, 's') },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'this-slug-must-be-changed-from-227-to-226-bytes'.padEnd(226, 's'),
        title: createdSponsoredContent.title,
        body: createdSponsoredContent.body,
        source_url: null,
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: null,
        tabcoins: 1,
        tabcash: 10,
        owner_username: defaultUser.username,
      });
    });

    test('Updating "title" containing more than 255 characters', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          title: 'Title with 256 characters'.padEnd(256, 's'),
        },
      );

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"title" deve conter no máximo 255 caracteres.',
        action: 'Ajuste os dados enviados e tente novamente.',
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'title',
        type: 'string.max',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
    });

    test('Updating "source_url"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "source_url"',
        tabcash: 50,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { source_url: 'https://example.com' },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: createdSponsoredContent.slug,
        title: createdSponsoredContent.title,
        body: createdSponsoredContent.body,
        source_url: 'https://example.com',
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: null,
        tabcoins: 1,
        tabcash: 50,
        owner_username: defaultUser.username,
      });
    });

    test('Updating all possible fields', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Original title',
        body: 'Body',
        tabcash: 50,
        source_url: 'https://example.com',
      });

      const deactivate_at = new Date(Date.now() + 30 * 60 * 1000);

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        {
          title: 'New title',
          body: 'New body!',
          slug: 'new-slug',
          source_url: 'https://example.com/new_url',
          deactivate_at: deactivate_at,
        },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'new-slug',
        title: 'New title',
        body: 'New body!',
        source_url: 'https://example.com/new_url',
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: deactivate_at.toISOString(),
        tabcoins: 1,
        tabcash: 50,
        owner_username: defaultUser.username,
      });
    });

    test('Updating a sponsored content with TabCash credits and debits', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Sponsored content title',
        tabcash: 50,
      });

      await orchestrator.createRate(createdSponsoredContent, 7);
      await orchestrator.createRate(createdSponsoredContent, -2);

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { title: 'New title with TabCoins credits and debits' },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: createdSponsoredContent.slug,
        title: 'New title with TabCoins credits and debits',
        body: createdSponsoredContent.body,
        source_url: createdSponsoredContent.source_url,
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: null,
        tabcoins: 8,
        tabcash: 41,
        owner_username: defaultUser.username,
      });
    });

    test('Updating "tabcash" to a lower value', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 10,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "slug"',
        tabcash: 10,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { tabcash: 5 },
      );

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: `Não é possível diminuir a quantidade de TabCash da publicação patrocinada.`,
        action: `Utilize um valor maior ou igual à quantidade atual de TabCash da publicação.`,
        error_location_code: 'MODEL:SPONSORED_CONTENT:VALIDATE_UPDATE_TABCASH:DECREASE_VALUE',
        key: 'tabcash',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Updating "tabcash" to the same value', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 10,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "slug"',
        tabcash: 10,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { tabcash: 10 },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: createdSponsoredContent.slug,
        title: createdSponsoredContent.title,
        body: createdSponsoredContent.body,
        source_url: createdSponsoredContent.source_url,
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: null,
        tabcoins: 1,
        tabcash: 10,
        owner_username: defaultUser.username,
      });
    });

    test('Updating "tabcash" to a higher value but user does not have enough TabCash', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 15,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "slug"',
        tabcash: 10,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { tabcash: 20 },
      );

      expect(response.status).toEqual(422);
      expect(responseBody).toStrictEqual({
        status_code: 422,
        name: 'UnprocessableEntityError',
        message: `Não foi possível utilizar TabCash para patrocinar esta publicação.`,
        action: `Você não possui 10 TabCash disponível.`,
        error_location_code: 'MODEL:BALANCE:SPONSOR_CONTENT:NOT_ENOUGH',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Updating "tabcash" to a higher value', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 15,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "slug"',
        tabcash: 10,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { tabcash: 15 },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: createdSponsoredContent.slug,
        title: createdSponsoredContent.title,
        body: createdSponsoredContent.body,
        source_url: createdSponsoredContent.source_url,
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: null,
        tabcoins: 1,
        tabcash: 15,
        owner_username: defaultUser.username,
      });

      const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`);
      const userResponseBody = await userResponse.json();

      expect(userResponseBody.tabcoins).toEqual(0);
      expect(userResponseBody.tabcash).toEqual(0);
    });

    test('Updating "tabcash" after the sponsored content spent some of it', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'Will update "slug"',
        tabcash: 10,
      });

      await orchestrator.createRate(createdSponsoredContent, 7);

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${defaultUser.username}/${createdSponsoredContent.slug}`,
        { tabcash: 10 },
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: createdSponsoredContent.slug,
        title: createdSponsoredContent.title,
        body: createdSponsoredContent.body,
        source_url: createdSponsoredContent.source_url,
        created_at: createdSponsoredContent.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        published_at: createdSponsoredContent.published_at.toISOString(),
        deactivate_at: null,
        tabcoins: 8,
        tabcash: 10,
        owner_username: defaultUser.username,
      });

      const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`);
      const userResponseBody = await userResponse.json();

      expect(userResponseBody.tabcoins).toEqual(0);
      expect(userResponseBody.tabcash).toEqual(33);
    });

    test('Updating a sponsored content from another user', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser({ with: ['update:sponsored_content'] });

      const secondUser = await orchestrator.createUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: secondUser.id,
        amount: 50,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: secondUser.id,
        title: 'Sponsored content title',
        tabcash: 50,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
        `/${secondUser.username}/${createdSponsoredContent.slug}`,
        { body: 'Updated body' },
      );

      expect(response.status).toEqual(403);
      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Você não possui permissão para atualizar a publicação patrocinada de outro usuário.',
        action: 'Verifique se você possui a feature "update:sponsored_content:others".',
        error_location_code: 'CONTROLLER:SPONSORED_CONTENT:PATCH:USER_CANT_UPDATE_SPONSORED_CONTENT_FROM_OTHER_USER',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    describe('User with "update:sponsored_content:others" feature', () => {
      test('Updating a sponsored content from another user', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        await sponsoredContentsRequestBuilder.buildUser({
          with: ['update:sponsored_content', 'update:sponsored_content:others'],
        });

        const secondUser = await orchestrator.createUser();
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: secondUser.id,
          amount: 50,
        });

        const createdSponsoredContent = await orchestrator.createSponsoredContent({
          owner_id: secondUser.id,
          title: 'Sponsored content title',
          tabcash: 50,
        });

        const deactivate_at = new Date(Date.now() + 15 * 60 * 1000);
        const { response, responseBody } = await sponsoredContentsRequestBuilder.patch(
          `/${secondUser.username}/${createdSponsoredContent.slug}`,
          { body: 'Updated body', deactivate_at: deactivate_at },
        );

        expect(response.status).toEqual(200);
        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: secondUser.id,
          slug: createdSponsoredContent.slug,
          title: createdSponsoredContent.title,
          body: 'Updated body',
          source_url: createdSponsoredContent.source_url,
          created_at: createdSponsoredContent.created_at.toISOString(),
          updated_at: responseBody.updated_at,
          published_at: createdSponsoredContent.published_at.toISOString(),
          deactivate_at: deactivate_at.toISOString(),
          tabcoins: 1,
          tabcash: 50,
          owner_username: secondUser.username,
        });

        expect(uuidVersion(responseBody.id)).toEqual(4);
        expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
        expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
        expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
        expect(responseBody.updated_at > createdSponsoredContent.updated_at.toISOString()).toEqual(true);
      });
    });
  });
});
