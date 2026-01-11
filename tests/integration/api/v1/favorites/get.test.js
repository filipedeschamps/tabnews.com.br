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

describe('GET /api/v1/favorites', () => {
  describe('Anonymous user', () => {
    test('With existing "owner_id" and "slug" search param', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(
        `/api/v1/favorites?owner_id=${content.owner_id}&slug=${content.slug}`,
      );

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
    });

    test('With no search params', async () => {
      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(403);

      expect(responseBody.name).toBe('ForbiddenError');
    });
  });

  describe('Default user', () => {
    test('With existing "owner_id" and "slug" search param', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(
        `/api/v1/favorites?owner_id=${content.owner_id}&slug=${content.slug}`,
      );

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(200);
      expect(responseBody.is_saved).toBeUndefined();
    });

    test('With non existing "slug" search param', async () => {
      const contentOwnerUser = await orchestrator.createUser();

      const favoritesRequestBuilder = new RequestBuilder(
        `/api/v1/favorites?owner_id=${contentOwnerUser.id}&slug=totally-random-and-non-existing-slug`,
      );

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
    });

    test('With unpublished "slug" search param', async () => {
      const contentOwnerUser = await orchestrator.createUser();

      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
        status: 'draft',
      });

      const favoritesRequestBuilder = new RequestBuilder(
        `/api/v1/favorites?owner_id=${content.owner_id}&slug=${content.slug}`,
      );
      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
    });

    test('With no search params (user have favorites)', async () => {
      const contentOwnerUser = await orchestrator.createUser();

      const content1 = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const content2 = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
        title: 'SECOND' + CONTENT_DATA.title,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const favoriteContents = [
        await favoritesRequestBuilder.post({
          owner_id: content1.owner_id,
          slug: content1.slug,
        }),
        await favoritesRequestBuilder.post({
          owner_id: content2.owner_id,
          slug: content2.slug,
        }),
      ];

      expect.soft(favoriteContents[0].response.status).toBe(201);
      expect.soft(favoriteContents[1].response.status).toBe(201);

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        saved_contents: [
          {
            title: content2.title,
            slug: content2.slug,
            body: content2.body,
            owner_username: contentOwnerUser.username,
          },
          {
            title: content1.title,
            slug: content1.slug,
            body: content1.body,
            owner_username: contentOwnerUser.username,
          },
        ],
        total: 2,
      });
    });

    test("With no search params (user don't have favorites)", async () => {
      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        saved_contents: [],
        total: 0,
      });
    });
  });
});
