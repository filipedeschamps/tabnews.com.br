import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import parseLinkHeader from 'parse-link-header';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/search', () => {
  beforeEach(async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  describe('Anonymous user', () => {
    test('Missing search_term', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?search_scope=contents`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"search_term" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'search_term',
        type: 'any.required',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Missing search_scope', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?search_term=teste`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"search_scope" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'search_scope',
        type: 'any.required',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With invalid search_scope', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=users`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"search_scope" deve possuir um dos seguintes valores: "contents".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'search_scope',
        type: 'any.only',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With no content', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('With 2 "published" contents and search_term vazio', async () => {
      const defaultUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado',
        body: `Nenhum conteúdo deve ser mostrada na pesquisa com o termo em branco`,
        status: 'published',
      });

      const secondRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo criado',
        body: `Nenhum conteúdo deve ser mostrada na pesquisa com o termo em branco`,
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?search_term=&search_scope=contents`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual([]);
    });

    test('With 2 "published" contents and search_term = "teste"', async () => {
      const defaultUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado',
        body: `Esse conteúdo deve aparecer pois é um post de teste`,
        status: 'published',
      });

      const secondRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo criado',
        body: `Esse conteúdo não deve aparecer pois não possui nenhuma relação com a pesquisa`,
        status: 'published',
      });

      const thirdRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Terceiro conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
                 porque quando um conteúdo possui o "status" como "draft", ele não
                 esta pronto para ser listado publicamente.`,
        status: 'draft',
      });

      const NotRootContentPublished = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Quarto conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
                 porque quando um conteúdo possui um "parent_id",
                 significa que ele é uma resposta a um outro conteúdo.`,
        status: 'published',
      });

      const NotRootContentDraft = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Quinto conteúdo criado',
        body: `Este conteúdo não somente não deve aparecer na lista principal,
                 como também não deve ser contabilizado no "children_deep_count".`,
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual([
        {
          id: firstRootContent.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'primeiro-conteudo-criado',
          title: 'Primeiro conteúdo criado',
          status: 'published',
          source_url: null,
          created_at: firstRootContent.created_at.toISOString(),
          updated_at: firstRootContent.updated_at.toISOString(),
          published_at: firstRootContent.published_at.toISOString(),
          deleted_at: null,
          tabcoins: 1,
          owner_username: defaultUser.username,
          children_deep_count: 1,
        },
      ]);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(uuidVersion(responseBody[0].owner_id)).toEqual(4);
    });

    test('With 3 children 3 level deep and search_term = "conteúdo"', async () => {
      const defaultUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo raiz',
        status: 'published',
      });

      const level1Content = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        body: 'Nível 1',
        status: 'published',
      });

      const level2Content = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: level1Content.id,
        body: 'Nível 2',
        status: 'published',
      });

      const level3Content = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: level2Content.id,
        body: 'Nível 3',
        status: 'published',
      });

      const level4ContentDeleted = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: level2Content.id,
        body: 'Nível 4 (vai ser deletado e não deve ser contabilizado)',
        status: 'published',
      });
      await orchestrator.updateContent(level4ContentDeleted.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=conteúdo&search_scope=contents`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual([
        {
          id: rootContent.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'conteudo-raiz',
          title: 'Conteúdo raiz',
          status: 'published',
          source_url: null,
          created_at: rootContent.created_at.toISOString(),
          updated_at: rootContent.updated_at.toISOString(),
          published_at: rootContent.published_at.toISOString(),
          deleted_at: null,
          tabcoins: 1,
          owner_username: defaultUser.username,
          children_deep_count: 3,
        },
      ]);
    });

    test('With 60 entries, default "page", "per_page" and search_term = "posts pesquisados"', async () => {
      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 120;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          body: item % 2 === 0 ? `esse post deve ser pesquisado` : `esse aqui não entra na lista`,
          status: 'published',
        });
      }

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=posts%20pesquisados&search_scope=contents`
      );
      const responseBody = await response.json();

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
          url: 'http://localhost:3000/api/v1/contents?strategy=new&page=1&per_page=30',
        },
        next: {
          page: '2',
          per_page: '30',
          rel: 'next',
          strategy: 'new',
          url: 'http://localhost:3000/api/v1/contents?strategy=new&page=2&per_page=30',
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'new',
          url: 'http://localhost:3000/api/v1/contents?strategy=new&page=2&per_page=30',
        },
      });

      expect(responseBody.length).toEqual(30);
      expect(responseBody[0].title).toEqual('Conteúdo #60');
      expect(responseBody[29].title).toEqual('Conteúdo #31');
    });
  });
});
