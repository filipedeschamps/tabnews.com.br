import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import parseLinkHeader from 'parse-link-header';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents/[username]', () => {
  describe('Anonymous user', () => {
    test('"username" non-existent', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/ThisUserDoesNotExists`);
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
    });

    test('"username" existent, but with no content at all', async () => {
      const defaultUser = await orchestrator.createUser();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    describe('Searching for root content', () => {
      test('"username" existent, but with no "published" "root" content', async () => {
        const defaultUser = await orchestrator.createUser();

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Draft content',
          body: 'Draft content',
          status: 'draft',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/root`);
        const responseBody = await response.json();

        expect(response.status).toEqual(200);
        expect(responseBody).toEqual([]);
      });

      test('"username" existent and only with "published" "child" content', async () => {
        const defaultUser = await orchestrator.createUser();

        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root content',
          body: 'Root content',
          status: 'draft',
        });

        const childContent = await orchestrator.createContent({
          parent_id: rootContent.id,
          owner_id: defaultUser.id,
          title: 'Child content',
          body: 'Child content',
          status: 'published',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/root`);
        const responseBody = await response.json();

        expect(response.status).toEqual(200);
        expect(responseBody).toEqual([]);
      });

      test('"username" existent with 4 contents, but only 2 "root" "published" and strategy "new"', async () => {
        const defaultUser = await orchestrator.createUser();

        const firstRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Primeiro conteúdo criado',
          status: 'published',
        });

        const secondRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Segundo conteúdo criado',
          status: 'published',
        });

        const thirdRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Terceiro conteúdo criado',
          body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents/[username],
                porque quando um conteúdo possui o "status" como "draft", ele não
                esta pronto para ser listado publicamente.`,
          status: 'draft',
        });

        const NotRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: firstRootContent.id,
          title: 'Quarto conteúdo criado',
          body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents[username],
                porque quando um conteúdo possui um "parent_id",
                significa que ele é uma resposta a um outro conteúdo.`,
          status: 'published',
        });

        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/root?strategy=new`
        );
        const responseBody = await response.json();

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual([
          {
            id: secondRootContent.id,
            owner_id: defaultUser.id,
            parent_id: null,
            slug: 'segundo-conteudo-criado',
            title: 'Segundo conteúdo criado',
            status: 'published',
            source_url: null,
            created_at: secondRootContent.created_at.toISOString(),
            updated_at: secondRootContent.updated_at.toISOString(),
            published_at: secondRootContent.published_at.toISOString(),
            deleted_at: null,
            tabcoins: 1,
            owner_username: defaultUser.username,
            children_deep_count: 0,
          },
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
        expect(uuidVersion(responseBody[1].id)).toEqual(4);
        expect(uuidVersion(responseBody[0].owner_id)).toEqual(4);
        expect(uuidVersion(responseBody[1].owner_id)).toEqual(4);
        expect(responseBody[0].published_at > responseBody[1].published_at).toEqual(true);
      });

      test('"username" existent with 60 contents, default pagination and strategy "new" (searching for root content)', async () => {
        const defaultUser = await orchestrator.createUser();

        const numberOfContents = 60;

        for (let item = 0; item < numberOfContents; item++) {
          await orchestrator.createContent({
            owner_id: defaultUser.id,
            title: `Conteúdo #${item + 1}`,
            status: 'published',
          });
        }

        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/root?strategy=new`
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
            url: `http://localhost:3000/api/v1/contents/${defaultUser.username}/root?strategy=new&page=1&per_page=30`,
          },
          next: {
            page: '2',
            per_page: '30',
            rel: 'next',
            strategy: 'new',
            url: `http://localhost:3000/api/v1/contents/${defaultUser.username}/root?strategy=new&page=2&per_page=30`,
          },
          last: {
            page: '2',
            per_page: '30',
            rel: 'last',
            strategy: 'new',
            url: `http://localhost:3000/api/v1/contents/${defaultUser.username}/root?strategy=new&page=2&per_page=30`,
          },
        });

        expect(responseBody.length).toEqual(30);
        expect(responseBody[0].title).toEqual('Conteúdo #60');
        expect(responseBody[29].title).toEqual('Conteúdo #31');
      });
    });

    describe('Searching for child content', () => {
      test('"username" existent, but with no "published" "child" content', async () => {
        const defaultUser = await orchestrator.createUser();

        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root content published',
          body: 'Root content published',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child content draft',
          body: 'Child content draft',
          status: 'draft',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/children`);
        const responseBody = await response.json();

        expect(response.status).toEqual(200);
        expect(responseBody).toEqual([]);
      });

      test('"username" existent and only with "published" "root" content', async () => {
        const defaultUser = await orchestrator.createUser();

        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root content published',
          body: 'Root content published',
          status: 'published',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/children`);
        const responseBody = await response.json();

        expect(response.status).toEqual(200);
        expect(responseBody).toEqual([]);
      });

      test('"username" existent with 5 contents, but only 2 "child" "published" and strategy "new"', async () => {
        const defaultUser = await orchestrator.createUser();

        const firstRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Primeiro conteúdo criado',
          body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents[username],
          porque quando um conteúdo não possui um "parent_id",
          significa que ele não é uma resposta a um outro conteúdo.`,
          status: 'published',
        });

        const secondRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Segundo conteúdo criado',
          body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents[username],
          porque quando um conteúdo não possui um "parent_id",
          significa que ele não é uma resposta a um outro conteúdo.`,
          status: 'published',
        });

        const firstNotRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: firstRootContent.id,
          title: 'Quarto conteúdo criado',
          body: `Este conteúdo deverá aparecer na lista retornada pelo /contents[username],
                porque quando um conteúdo possui um "parent_id",
                significa que ele é uma resposta a um outro conteúdo.`,
          status: 'published',
        });

        const secondNotRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: secondRootContent.id,
          title: 'Quinto contéudo criado',
          body: `Este conteúdo deverá aparecer na lista retornada pelo /contents[username],
                porque quando um conteúdo possui um "parent_id",
                significa que ele é uma resposta a um outro conteúdo.`,
          status: 'published',
        });

        const thirdNotRootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: secondRootContent.id,
          title: 'Sexto conteúdo criado',
          body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents/[username],
                porque quando um conteúdo possui o "status" como "draft", ele não
                esta pronto para ser listado publicamente.`,
          status: 'draft',
        });

        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/children?strategy=new`
        );
        const responseBody = await response.json();

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual([
          {
            id: secondNotRootContent.id,
            owner_id: defaultUser.id,
            parent_id: secondRootContent.id,
            slug: 'quinto-conteudo-criado',
            title: 'Quinto contéudo criado',
            body: secondNotRootContent.body.substring(0, 35) + '...',
            status: 'published',
            source_url: null,
            created_at: secondNotRootContent.created_at.toISOString(),
            updated_at: secondNotRootContent.updated_at.toISOString(),
            published_at: secondNotRootContent.published_at.toISOString(),
            deleted_at: null,
            tabcoins: 0,
            owner_username: defaultUser.username,
            children_deep_count: 0,
          },
          {
            id: firstNotRootContent.id,
            owner_id: defaultUser.id,
            parent_id: firstRootContent.id,
            slug: 'quarto-conteudo-criado',
            title: 'Quarto conteúdo criado',
            body: firstNotRootContent.body.substring(0, 35) + '...',
            status: 'published',
            source_url: null,
            created_at: firstNotRootContent.created_at.toISOString(),
            updated_at: firstNotRootContent.updated_at.toISOString(),
            published_at: firstNotRootContent.published_at.toISOString(),
            deleted_at: null,
            tabcoins: 0,
            owner_username: defaultUser.username,
            children_deep_count: 0,
          },
        ]);

        expect(uuidVersion(responseBody[0].id)).toEqual(4);
        expect(uuidVersion(responseBody[1].id)).toEqual(4);
        expect(uuidVersion(responseBody[0].owner_id)).toEqual(4);
        expect(uuidVersion(responseBody[1].owner_id)).toEqual(4);
        expect(responseBody[0].published_at > responseBody[1].published_at).toEqual(true);
      });

      test('"username" existent with 61 contents, default pagination and strategy "new"', async () => {
        const defaultUser = await orchestrator.createUser();
        const rootContentToChildren = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Conteúdo root para 60 conteúdos child',
        });

        const numberOfContents = 60;

        for (let item = 0; item < numberOfContents; item++) {
          await orchestrator.createContent({
            owner_id: defaultUser.id,
            parent_id: rootContentToChildren.id,
            title: `Conteúdo child #${item + 1}`,
            status: 'published',
          });
        }

        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/children?strategy=new`
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
            url: `http://localhost:3000/api/v1/contents/${defaultUser.username}/children?strategy=new&page=1&per_page=30`,
          },
          next: {
            page: '2',
            per_page: '30',
            rel: 'next',
            strategy: 'new',
            url: `http://localhost:3000/api/v1/contents/${defaultUser.username}/children?strategy=new&page=2&per_page=30`,
          },
          last: {
            page: '2',
            per_page: '30',
            rel: 'last',
            strategy: 'new',
            url: `http://localhost:3000/api/v1/contents/${defaultUser.username}/children?strategy=new&page=2&per_page=30`,
          },
        });

        expect(responseBody.length).toEqual(30);
        expect(responseBody[0].title).toEqual('Conteúdo child #60');
        expect(responseBody[0].parent_id).toEqual(rootContentToChildren.id);
        expect(responseBody[29].title).toEqual('Conteúdo child #31');
        expect(responseBody[29].parent_id).toEqual(rootContentToChildren.id);
      });
    });
  });
});
