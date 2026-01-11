import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

const CONTENT_DATA = {
  title: 'Conteúdo massa sobre uma IA que imita uma borboleta',
  body: 'Flap flap flap flap (borboleta voando).',
  status: 'published',
};

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('DELETE /api/v1/favorites', () => {
  describe('Anonymous user', () => {
    test('With valid body (should not be able to delete any)', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const { response, responseBody } = await favoritesRequestBuilder.delete({
        owner_id: content.owner_id,
        slug: content.slug,
      });

      expect.soft(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
    });
  });

  describe('Default user', () => {
    test('With valid body', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      const { response: postResponse } = await favoritesRequestBuilder.post({
        owner_id: content.owner_id,
        slug: content.slug,
      });

      expect.soft(postResponse.status).toBe(201);

      const { response: deleteResponse, responseBody: deleteResponseBody } = await favoritesRequestBuilder.delete({
        owner_id: content.owner_id,
        slug: content.slug,
      });

      expect.soft(deleteResponse.status).toBe(200);
      expect(deleteResponseBody).toHaveProperty('is_saved');
      expect(deleteResponseBody.is_saved).toBe(false);

      const getRequestBuilder = new RequestBuilder(
        `/api/v1/favorites?owner_id=${content.owner_id}&slug=${content.slug}`,
      );
      await getRequestBuilder.setUser(user);
      getRequestBuilder.buildHeaders();

      const { response: getResponse, responseBody: getResponseBody } = await getRequestBuilder.get();

      expect.soft(getResponse.status).toBe(200);
      expect(getResponseBody.is_saved).toBe(false);
    });

    test('With another user favorited content', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const firstUserRequestBuilder = new RequestBuilder(`/api/v1/favorites`);
      const firstUser = await firstUserRequestBuilder.buildUser({
        with: ['update:user'],
      });
      await firstUserRequestBuilder.setUser(firstUser);
      firstUserRequestBuilder.buildHeaders();

      await firstUserRequestBuilder.post({
        owner_id: content.owner_id,
        slug: content.slug,
      });

      const secondUserRequestBuilder = new RequestBuilder(`/api/v1/favorites`);
      const secondUser = await secondUserRequestBuilder.buildUser({
        with: ['update:user'],
      });
      await secondUserRequestBuilder.setUser(secondUser);
      secondUserRequestBuilder.buildHeaders();

      const { response, responseBody } = await secondUserRequestBuilder.delete({
        owner_id: content.owner_id,
        slug: content.slug,
      });

      expect.soft(response.status).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
    });

    test('With non existing favorite', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.delete({
        owner_id: content.owner_id,
        slug: content.slug,
      });

      expect.soft(response.status).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
    });

    test('With invalid body', async () => {
      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      const { response: responseMissingSlug, responseBody: responseBodyMissingSlug } =
        await favoritesRequestBuilder.delete({
          owner_id: 'some-owner-id',
        });

      expect.soft(responseMissingSlug.status).toBe(400);
      expect(responseBodyMissingSlug.name).toBe('ValidationError');

      const { response: responseMissingOwnerId, responseBody: responseBodyMissingOwnerId } =
        await favoritesRequestBuilder.delete({
          slug: 'some-slug',
        });

      expect.soft(responseMissingOwnerId.status).toBe(400);
      expect(responseBodyMissingOwnerId.name).toBe('ValidationError');

      const { response: responseEmptyBody, responseBody: responseBodyEmpty } = await favoritesRequestBuilder.delete({});

      expect.soft(responseEmptyBody.status).toBe(400);
      expect(responseBodyEmpty.name).toBe('ValidationError');
    });

    test('With non existing content', async () => {
      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.delete({
        owner_id: 'non-existing-owner',
        slug: 'non-existing-slug',
      });

      expect.soft(response.status).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
    });
  });
});
