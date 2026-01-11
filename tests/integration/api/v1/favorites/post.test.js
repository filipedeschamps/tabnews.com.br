import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

const CONTENT_DATA = {
  title: 'Conteúdo massa sobre uma IA que imita uma borboleta',
  body: 'Flap flap flap flap (borboleta voando).',
  status: 'published',
};

const CREATE_CONTENT_FEATURES = ['create:content', 'create:content:text_root', 'create:content:text_child'];

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/favorites', () => {
  describe('Anonymous user', () => {
    test('With valid "body" and request, but not logged in', async () => {
      const owner = await orchestrator.createUser();

      const content = await orchestrator.createContent({
        owner_id: owner.id,
        ...CONTENT_DATA,
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_id: owner.id,
          slug: content.slug,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.status_code).toBe(403);
    });
  });

  describe('User with "update:user" feature', () => {
    test('With their own content as param', async () => {
      const favoritesRequestBuilder = new RequestBuilder('/api/v1/favorites');

      const userObject = await favoritesRequestBuilder.buildUser({
        with: ['update:user', ...CREATE_CONTENT_FEATURES],
      });

      await favoritesRequestBuilder.setUser(userObject);

      favoritesRequestBuilder.buildHeaders();

      const loggedUserContent = await orchestrator.createContent({
        ...CONTENT_DATA,
        owner_id: userObject.id,
      });

      const { response, responseBody } = await favoritesRequestBuilder.post({
        owner_id: userObject.id,
        slug: loggedUserContent.slug,
      });

      expect.soft(response.status).toBe(400);

      expect(responseBody.message).toBe('Você não pode salvar seus próprios conteúdos.');
    });

    test("With another user's content as param", async () => {
      const contentOwnerUser = await orchestrator.createUser();

      const content = await orchestrator.createContent({
        ...CONTENT_DATA,
        owner_id: contentOwnerUser.id,
      });

      const favoritesRequestBuilder = new RequestBuilder('/api/v1/favorites');

      const userObject = await favoritesRequestBuilder.buildUser({
        with: ['update:user', ...CREATE_CONTENT_FEATURES],
      });

      await favoritesRequestBuilder.setUser(userObject);
      favoritesRequestBuilder.buildHeaders();

      const { response, responseBody } = await favoritesRequestBuilder.post({
        owner_id: contentOwnerUser.id,
        slug: content.slug,
      });

      expect.soft(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        is_saved: true,
      });
    });

    test('With an already favorite content as param', async () => {
      const contentOwnerUser = await orchestrator.createUser();

      const content = await orchestrator.createContent({
        ...CONTENT_DATA,
        owner_id: contentOwnerUser.id,
      });

      const favoritesRequestBuilder = new RequestBuilder('/api/v1/favorites');

      const userObject = await favoritesRequestBuilder.buildUser({
        with: ['update:user', ...CREATE_CONTENT_FEATURES],
      });

      await favoritesRequestBuilder.setUser(userObject);
      favoritesRequestBuilder.buildHeaders();

      const favoriteContent = async () =>
        await favoritesRequestBuilder.post({
          owner_id: contentOwnerUser.id,
          slug: content.slug,
        });

      const response1 = await favoriteContent();

      expect.soft(response1.response.status).toBe(201);

      expect.soft(response1.responseBody).toStrictEqual({
        is_saved: true,
      });

      const response2 = await favoriteContent();

      expect.soft(response2.response.status).toBe(400);

      expect.soft(response2.responseBody.message).toBe('Este conteúdo já foi salvo anteriormente.');

      const response3 = await favoriteContent();

      expect.soft(response3.response.status).toBe(400);

      expect.soft(response3.responseBody.message).toStrictEqual('Este conteúdo já foi salvo anteriormente.');
    });
  });
});
