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

    test('With 3 children 3 level deep and search_term = "conteudo"', async () => {
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
        `${orchestrator.webserverUrl}/api/v1/search?search_term=conteudo&search_scope=contents`
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
          search_scope: 'contents',
          search_term: 'posts pesquisados',
          url: 'http://localhost:3000/api/v1/search?search_term=posts%20pesquisados&search_scope=contents&page=1&per_page=30',
        },
        next: {
          page: '2',
          per_page: '30',
          rel: 'next',
          search_scope: 'contents',
          search_term: 'posts pesquisados',
          url: 'http://localhost:3000/api/v1/search?search_term=posts%20pesquisados&search_scope=contents&page=2&per_page=30',
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          search_scope: 'contents',
          search_term: 'posts pesquisados',
          url: 'http://localhost:3000/api/v1/search?search_term=posts%20pesquisados&search_scope=contents&page=2&per_page=30',
        },
      });

      expect(responseBody.length).toEqual(30);
    });

    test('Search for 3 contents in order of relevance', async () => {
      const defaultUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado | Média Relevância',
        body: `Esse conteúdo tem média relevância para o tema pesquisado:
        Python é considerada linguagem de programação mais fácil de se aprender`,
        status: 'published',
      });

      const secondRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo criado | Baixa Relevância',
        body: `Esse conteúdo tem baixa relevância para o tema pesquisado:
        O inglês é uma lingua muito utilizada no mundo da programação`,
        status: 'published',
      });

      const thirdRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Terceiro conteúdo criado | Rascunho',
        body: `Esse conteúdo tem alta relevância para o tema pesquisado, mas não será listado pois é um rascunho:
        Javascript segue sendo a melhor linguagem de programação`,
        status: 'draft',
      });

      const fourthRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Quarto conteúdo criado | Alta Relevância',
        body: `Esse conteúdo tem alta relevância para o tema pesquisado:
        Javascript segue sendo a melhor linguagem de programação`,
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=javascript%20é%20a%20melhor%20linguagem%20de%20programação&search_scope=contents`
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.length).toEqual(3);
      expect(responseBody[0].title).toEqual('Quarto conteúdo criado | Alta Relevância');
      expect(responseBody[1].title).toEqual('Primeiro conteúdo criado | Média Relevância');
      expect(responseBody[2].title).toEqual('Segundo conteúdo criado | Baixa Relevância');
    });

    test('With 9 entries with same search relevance, custom "page" and "per_page"(navigating using Link Header)', async () => {
      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 9;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo master #${item + 1}`,
          status: 'published',
        });
      }

      const page1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=master&search_scope=contents&page=1&per_page=3`
      );
      const page1Body = await page1.json();

      const page1LinkHeader = parseLinkHeader(page1.headers.get('Link'));
      const page1TotalRowsHeader = page1.headers.get('X-Pagination-Total-Rows');

      expect(page1.status).toEqual(200);
      expect(page1TotalRowsHeader).toEqual('9');
      expect(page1LinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '3',
          rel: 'first',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=1&per_page=3',
        },
        next: {
          page: '2',
          per_page: '3',
          rel: 'next',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=2&per_page=3',
        },
        last: {
          page: '3',
          per_page: '3',
          rel: 'last',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=3&per_page=3',
        },
      });

      expect(page1Body.length).toEqual(3);
      expect(page1Body[0].title).toEqual('Conteúdo master #9');
      expect(page1Body[1].title).toEqual('Conteúdo master #8');
      expect(page1Body[2].title).toEqual('Conteúdo master #7');

      const page2 = await fetch(page1LinkHeader.next.url);
      const page2Body = await page2.json();

      const page2LinkHeader = parseLinkHeader(page2.headers.get('Link'));
      const page2TotalRowsHeader = page2.headers.get('X-Pagination-Total-Rows');

      expect(page2.status).toEqual(200);
      expect(page2TotalRowsHeader).toEqual('9');
      expect(page2LinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '3',
          rel: 'first',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=1&per_page=3',
        },
        prev: {
          page: '1',
          per_page: '3',
          rel: 'prev',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=1&per_page=3',
        },
        next: {
          page: '3',
          per_page: '3',
          rel: 'next',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=3&per_page=3',
        },
        last: {
          page: '3',
          per_page: '3',
          rel: 'last',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=3&per_page=3',
        },
      });

      expect(page2Body.length).toEqual(3);
      expect(page2Body[0].title).toEqual('Conteúdo master #6');
      expect(page2Body[1].title).toEqual('Conteúdo master #5');
      expect(page2Body[2].title).toEqual('Conteúdo master #4');

      const page3 = await fetch(page2LinkHeader.next.url);
      const page3Body = await page3.json();

      const page3LinkHeader = parseLinkHeader(page3.headers.get('Link'));
      const page3TotalRowsHeader = page3.headers.get('X-Pagination-Total-Rows');

      expect(page3.status).toEqual(200);
      expect(page3TotalRowsHeader).toEqual('9');
      expect(page3LinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '3',
          rel: 'first',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=1&per_page=3',
        },
        prev: {
          page: '2',
          per_page: '3',
          rel: 'prev',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=2&per_page=3',
        },
        last: {
          page: '3',
          per_page: '3',
          rel: 'last',
          search_scope: 'contents',
          search_term: 'master',
          url: 'http://localhost:3000/api/v1/search?search_term=master&search_scope=contents&page=3&per_page=3',
        },
      });

      expect(page3Body.length).toEqual(3);
      expect(page3Body[0].title).toEqual('Conteúdo master #3');
      expect(page3Body[1].title).toEqual('Conteúdo master #2');
      expect(page3Body[2].title).toEqual('Conteúdo master #1');

      // FIRST AND LAST PAGE USING "PAGE 1" LINK HEADER
      const firstPage = await fetch(page1LinkHeader.first.url);
      const firstPageBody = await firstPage.json();
      const firstPageLinkHeader = parseLinkHeader(firstPage.headers.get('Link'));
      const firstPageTotalRowsHeader = firstPage.headers.get('X-Pagination-Total-Rows');

      expect(firstPage.status).toEqual(200);
      expect(firstPageTotalRowsHeader).toEqual(page1TotalRowsHeader);
      expect(firstPageLinkHeader).toStrictEqual(page1LinkHeader);
      expect(firstPageBody).toEqual(page1Body);

      const lastPage = await fetch(page1LinkHeader.last.url);
      const lastPageBody = await lastPage.json();
      const lastPageLinkHeader = parseLinkHeader(lastPage.headers.get('Link'));
      const lastPageTotalRowsHeader = lastPage.headers.get('X-Pagination-Total-Rows');

      expect(lastPage.status).toEqual(200);
      expect(lastPageTotalRowsHeader).toEqual(page3TotalRowsHeader);
      expect(lastPageLinkHeader).toStrictEqual(page3LinkHeader);
      expect(lastPageBody).toEqual(page3Body);
    });

    test('With "page" with a String', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&page=CINCO`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve ser do tipo Number.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.base',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with an invalid minimum Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&page=0`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve possuir um valor mínimo de 1.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.min',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with an invalid maximum Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&page=9007199254740991`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve possuir um valor máximo de 9007199254740990.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.max',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with an unsafe Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&page=9007199254740992`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve possuir um valor máximo de 9007199254740990.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.unsafe',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with a Float Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&page=1.5`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve ser um Inteiro.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.integer',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with a String', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&per_page=SEIS`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve ser do tipo Number.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.base',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with an invalid minimum Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&per_page=0`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve possuir um valor mínimo de 1.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.min',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with an invalid maximum Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&per_page=9007199254740991`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve possuir um valor máximo de 100.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.max',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with an unsafe Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&per_page=9007199254740992`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve possuir um valor máximo de 100.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.unsafe',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with a Float Number', async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/search?search_term=teste&search_scope=contents&per_page=1.5`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve ser um Inteiro.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.integer',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });
});
