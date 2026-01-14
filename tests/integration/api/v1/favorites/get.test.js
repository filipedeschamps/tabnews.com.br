import { randomUUID } from 'node:crypto';

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

describe('GET /api/v1/favorites/:content_id/status', () => {
  describe('Anonymous user', () => {
    test('With existing content_id param', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites/${content.id}/status`);

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
    });
  });

  describe('Default user', () => {
    test('With existing content_id param', async () => {
      const contentOwnerUser = await orchestrator.createUser();
      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites/${content.id}/status`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(200);
      expect.soft(responseBody.is_saved).toBe(false);

      const setAsFavoriteRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      await setAsFavoriteRequestBuilder.setUser(user);
      setAsFavoriteRequestBuilder.buildHeaders();

      const { response: postResponse } = await setAsFavoriteRequestBuilder.post({ content_id: content.id });

      expect.soft(postResponse.status).toBe(201);

      const { response: afterFavoriteResponse, responseBody: afterFavoriteResponseBody } =
        await favoritesRequestBuilder.get();

      expect.soft(afterFavoriteResponse.status).toBe(200);
      expect.soft(afterFavoriteResponseBody.is_saved).toBe(true);
    });

    test('With non existing content_id param', async () => {
      const nonExistentId = randomUUID();

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites/${nonExistentId}/status`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
    });

    test('With unpublished content_id param', async () => {
      const contentOwnerUser = await orchestrator.createUser();

      const content = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
        status: 'draft',
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites/${content.id}/status`);
      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);

      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
    });
  });
});

describe('GET /api/v1/favorites', () => {
  describe('Anonymous user', () => {
    test('With no search params', async () => {
      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(403);

      expect(responseBody.name).toBe('ForbiddenError');
    });
  });

  describe('Default user', () => {
    test('With no search params (user has many favorites)', async () => {
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
        await favoritesRequestBuilder.post({ content_id: content1.id }),
        await favoritesRequestBuilder.post({ content_id: content2.id }),
      ];

      expect.soft(favoriteContents[0].response.status).toBe(201);
      expect.soft(favoriteContents[1].response.status).toBe(201);

      const { response, responseBody } = await favoritesRequestBuilder.get();

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        saved_contents: [
          {
            children_deep_count: 0,
            id: content2.id,
            title: content2.title,
            slug: content2.slug,
            body: content2.body,
            owner_username: contentOwnerUser.username,
            owner_id: content2.owner_id,
            created_at: responseBody.saved_contents[0].created_at,
            published_at: responseBody.saved_contents[0].published_at,
            updated_at: responseBody.saved_contents[0].updated_at,
            tabcoins: 0,
          },
          {
            children_deep_count: 0,
            id: content1.id,
            title: content1.title,
            slug: content1.slug,
            body: content1.body,
            owner_username: contentOwnerUser.username,
            owner_id: content1.owner_id,
            created_at: responseBody.saved_contents[1].created_at,
            published_at: responseBody.saved_contents[1].published_at,
            updated_at: responseBody.saved_contents[1].updated_at,
            tabcoins: 0,
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

    test('With pagination (page 1, per_page 1)', async () => {
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

      const content3 = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
        title: 'THIRD' + CONTENT_DATA.title,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      await favoritesRequestBuilder.post({ content_id: content1.id });

      await favoritesRequestBuilder.post({ content_id: content2.id });

      await favoritesRequestBuilder.post({ content_id: content3.id });

      const page1RequestBuilder = new RequestBuilder(`/api/v1/favorites?page=1&per_page=1`);
      await page1RequestBuilder.setUser(user);
      page1RequestBuilder.buildHeaders();

      const { response: page1Response, responseBody: page1Body } = await page1RequestBuilder.get();

      expect.soft(page1Response.status).toBe(200);
      expect.soft(page1Body.saved_contents).toHaveLength(1);
      expect.soft(page1Body.total).toBe(3);
      expect.soft(page1Body.saved_contents[0].title).toBe(content3.title);
    });

    test('With pagination (page 2, per_page 1)', async () => {
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

      const content3 = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
        title: 'THIRD' + CONTENT_DATA.title,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      await favoritesRequestBuilder.post({ content_id: content1.id });

      await favoritesRequestBuilder.post({ content_id: content2.id });

      await favoritesRequestBuilder.post({ content_id: content3.id });

      const page2RequestBuilder = new RequestBuilder(`/api/v1/favorites?page=2&per_page=1`);
      await page2RequestBuilder.setUser(user);
      page2RequestBuilder.buildHeaders();

      const { response: page2Response, responseBody: page2Body } = await page2RequestBuilder.get();

      expect.soft(page2Response.status).toBe(200);
      expect.soft(page2Body.saved_contents).toHaveLength(1);
      expect.soft(page2Body.total).toBe(3);
      expect.soft(page2Body.saved_contents[0].title).toBe(content2.title);
    });

    test('With pagination (page 3, per_page 1)', async () => {
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

      const content3 = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
        title: 'THIRD' + CONTENT_DATA.title,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      await favoritesRequestBuilder.post({ content_id: content1.id });

      await favoritesRequestBuilder.post({ content_id: content2.id });

      await favoritesRequestBuilder.post({ content_id: content3.id });

      const page3RequestBuilder = new RequestBuilder(`/api/v1/favorites?page=3&per_page=1`);
      await page3RequestBuilder.setUser(user);
      page3RequestBuilder.buildHeaders();

      const { response: page3Response, responseBody: page3Body } = await page3RequestBuilder.get();

      expect.soft(page3Response.status).toBe(200);
      expect.soft(page3Body.saved_contents).toHaveLength(1);
      expect.soft(page3Body.total).toBe(3);
      expect.soft(page3Body.saved_contents[0].title).toBe(content1.title);
    });

    test('With pagination (page beyond available content)', async () => {
      const contentOwnerUser = await orchestrator.createUser();

      const content1 = await orchestrator.createContent({
        owner_id: contentOwnerUser.id,
        ...CONTENT_DATA,
      });

      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      await favoritesRequestBuilder.post({ content_id: content1.id });

      const page10RequestBuilder = new RequestBuilder(`/api/v1/favorites?page=10&per_page=1`);
      await page10RequestBuilder.setUser(user);
      page10RequestBuilder.buildHeaders();

      const { response, responseBody } = await page10RequestBuilder.get();

      expect.soft(response.status).toBe(200);
      expect.soft(responseBody.saved_contents).toHaveLength(0);
      expect.soft(responseBody.total).toBe(1);
    });

    test('With custom per_page (3 items)', async () => {
      const favoritesRequestBuilder = new RequestBuilder(`/api/v1/favorites`);

      const user = await favoritesRequestBuilder.buildUser({
        with: ['update:user'],
      });

      await favoritesRequestBuilder.setUser(user);
      favoritesRequestBuilder.buildHeaders();

      for (let i = 1; i <= 4; i++) {
        const contentOwnerUser = await orchestrator.createUser();

        const content = await orchestrator.createContent({
          owner_id: contentOwnerUser.id,
          ...CONTENT_DATA,
          title: `Content ${i}`,
        });

        await favoritesRequestBuilder.post({ content_id: content.id });
      }

      const page1RequestBuilder = new RequestBuilder(`/api/v1/favorites?page=1&per_page=3`);
      await page1RequestBuilder.setUser(user);
      page1RequestBuilder.buildHeaders();

      const { response: page1Response, responseBody: page1Body } = await page1RequestBuilder.get();

      expect.soft(page1Response.status).toBe(200);
      expect.soft(page1Body.saved_contents).toHaveLength(3);
      expect.soft(page1Body.total).toBe(4);

      const page2RequestBuilder = new RequestBuilder(`/api/v1/favorites?page=2&per_page=3`);
      await page2RequestBuilder.setUser(user);
      page2RequestBuilder.buildHeaders();

      const { response: page2Response, responseBody: page2Body } = await page2RequestBuilder.get();

      expect.soft(page2Response.status).toBe(200);
      expect.soft(page2Body.saved_contents).toHaveLength(1);
      expect.soft(page2Body.total).toBe(4);
    });
  });
});
