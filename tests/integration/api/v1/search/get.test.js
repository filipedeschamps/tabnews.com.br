import parseLinkHeader from 'parse-link-header';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/search', () => {
  const searchRequestBuilder = new RequestBuilder('/api/v1/search');

  describe('Anonymous user (dropAllTables beforeEach)', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });
    test('"q" is a required query params', async () => {
      const { response, responseBody } = await searchRequestBuilder.get();

      expect(response.status).toEqual(400);
      expect(responseBody).toEqual({
        name: 'ValidationError',
        message: '"q" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'q',
        type: 'any.required',
      });
    });

    const searchTerm = 'test';

    test('With invalid strategy', async () => {
      const { response, responseBody } = await searchRequestBuilder.get(
        `?q=${encodeURIComponent(searchTerm)}&strategy=invalid`,
      );

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"strategy" deve possuir um dos seguintes valores: "new", "old", "relevant".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'strategy',
        type: 'any.only',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With 1 "published" entries and strategy "new"', async () => {
      const defaultUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado 1',
        status: 'published',
      });

      await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado 2',
        body: `Este conteúdo não deve aparecer na lista, pois está em "draft".`,
        status: 'draft',
      });

      await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Primeiro conteúdo criado 3',
        body: `Este conteúdo não deve aparecer na lista, pois é um comentário.`,
        status: 'published',
      });

      await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Primeiro conteúdo criado 4',
        body: `Este conteúdo não deve aparecer na lista, pois está em "draft" e é um comentário.`,
        status: 'draft',
      });

      const searchTerm = 'primeiro';

      const { response, responseBody } = await searchRequestBuilder.get(
        `?q=${encodeURIComponent(searchTerm)}&strategy=new`,
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        contents: [
          {
            id: firstRootContent.id,
            owner_id: defaultUser.id,
            parent_id: null,
            slug: 'primeiro-conteudo-criado-1',
            title: 'Primeiro conteúdo criado 1',
            status: 'published',
            source_url: null,
            created_at: firstRootContent.created_at.toISOString(),
            updated_at: firstRootContent.updated_at.toISOString(),
            published_at: firstRootContent.published_at.toISOString(),
            deleted_at: null,
            tabcoins: 1,
            tabcoins_credit: 0,
            tabcoins_debit: 0,
            owner_username: defaultUser.username,
            children_deep_count: 1,
          },
        ],
      });

      expect(uuidVersion(responseBody.contents[0].id)).toEqual(4);
      expect(uuidVersion(responseBody.contents[0].owner_id)).toEqual(4);
    });

    test('With 2 "published" entries and strategy "relevant", expecting closest rank', async () => {
      const defaultUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título do conteúdo com pequena alteração',
        status: 'published',
      });

      await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título do conteúdo',
        status: 'published',
      });

      const searchTerm = 'Título do conteúdo com pequena alteração';

      const { response, responseBody } = await searchRequestBuilder.get(
        `?q=${encodeURIComponent(searchTerm)}&strategy=relevant`,
      );

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        contents: [
          {
            id: firstRootContent.id,
            owner_id: defaultUser.id,
            parent_id: null,
            slug: 'titulo-do-conteudo-com-pequena-alteracao',
            title: 'Título do conteúdo com pequena alteração',
            status: 'published',
            source_url: null,
            created_at: firstRootContent.created_at.toISOString(),
            updated_at: firstRootContent.updated_at.toISOString(),
            published_at: firstRootContent.published_at.toISOString(),
            deleted_at: null,
            owner_username: defaultUser.username,
            tabcoins: 1,
            tabcoins_credit: 0,
            tabcoins_debit: 0,
            children_deep_count: 0,
            rank: 1,
          },
        ],
      });
      expect(responseBody.contents.length).toEqual(1);
      expect(responseBody.contents[0].id).toEqual(firstRootContent.id);
    });

    test('With 60 entries, default "page", "per_page" and strategy "new"', async () => {
      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 60;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });
      }

      const searchTerm = 'Conteúdo';

      const { response, responseBody } = await searchRequestBuilder.get(
        `?q=${encodeURIComponent(searchTerm)}&strategy=new`,
      );

      const responseLinkHeader = parseLinkHeader(response.headers.get('Link'));
      const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

      expect(response.status).toEqual(200);
      expect(responseTotalRowsHeader).toEqual('60');
      expect(responseLinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '30',
          rel: 'first',
          strategy: 'new',
          q: `${searchTerm}`,
          url: `${orchestrator.webserverUrl}/api/v1/search?q=${encodeURIComponent(searchTerm)}&strategy=new&page=1&per_page=30`,
        },
        next: {
          page: '2',
          per_page: '30',
          rel: 'next',
          strategy: 'new',
          q: `${searchTerm}`,
          url: `${orchestrator.webserverUrl}/api/v1/search?q=${encodeURIComponent(searchTerm)}&strategy=new&page=2&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'new',
          q: `${searchTerm}`,
          url: `${orchestrator.webserverUrl}/api/v1/search?q=${encodeURIComponent(searchTerm)}&strategy=new&page=2&per_page=30`,
        },
      });

      expect(responseBody.contents.length).toEqual(30);
      expect(responseBody.contents[0].title).toEqual('Conteúdo #60');
      expect(responseBody.contents[29].title).toEqual('Conteúdo #31');
    });
  });
});
