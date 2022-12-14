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
      const secondUser = await orchestrator.createUser();

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('"username" existent, but with no "published" "root" content', async () => {
      const defaultUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Draft content',
        body: 'Draft content',
        status: 'draft',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('"username" existent and only with "published" "child" content (short body)', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content',
        body: 'Root content',
        status: 'draft',
      });

      const childContent = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: firstUser.id,
        body: 'Child content',
        status: 'published',
      });

      const childContentDraft = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: firstUser.id,
        body: 'Child content with draft status',
        status: 'draft',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([
        {
          id: childContent.id,
          owner_id: firstUser.id,
          parent_id: rootContent.id,
          slug: childContent.slug,
          title: null,
          body: 'Child content',
          status: 'published',
          source_url: null,
          created_at: childContent.created_at.toISOString(),
          updated_at: childContent.updated_at.toISOString(),
          published_at: childContent.published_at.toISOString(),
          deleted_at: null,
          owner_username: firstUser.username,
          tabcoins: 0,
          children_deep_count: 0,
        },
      ]);
    });

    test('"username" existent and only with "published" "child" content (long body)', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      const rootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root content',
        body: 'Root content',
        status: 'draft',
      });

      const childContent = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: firstUser.id,
        body: `Diferente do teste **anterior**, o corpo dessa publicação é grande,
        com quebras de linha, \`Markdown\` e ultrapassa o limite de caracteres que
        iremos devolver pelo response.

        ## Motivo

        Hoje estamos usando o mesmo número de caracteres de um \`title\` para que
        o frontend possa lidar com o mesmo tamanho de texto em ambos os casos.`,
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([
        {
          id: childContent.id,
          owner_id: firstUser.id,
          parent_id: rootContent.id,
          slug: childContent.slug,
          title: null,
          body: 'Diferente do teste anterior, o corpo dessa publicação é grande, com quebras de linha, Markdown e ultrapassa o limite de caracteres que iremos devolver pelo response. Motivo Hoje estamos usando o mesmo número de caracteres de um title para que o fronten...',
          status: 'published',
          source_url: null,
          created_at: childContent.created_at.toISOString(),
          updated_at: childContent.updated_at.toISOString(),
          published_at: childContent.published_at.toISOString(),
          deleted_at: null,
          owner_username: firstUser.username,
          tabcoins: 0,
          children_deep_count: 0,
        },
      ]);
    });

    test('"username" existent with 4 contents, with 2 "root" "published", 1 "child" "published", and strategy "new"', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Primeiro conteúdo criado',
        status: 'published',
      });

      const secondRootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Segundo conteúdo criado',
        status: 'published',
      });

      const thirdRootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Terceiro conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents/[username],
               porque quando um conteúdo possui o "status" como "draft", ele não
               esta pronto para ser listado publicamente.`,
        status: 'draft',
      });

      const childContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        parent_id: firstRootContent.id,
        body: `Este conteúdo agora deverá aparecer na lista retornada pelo /contents/[username]`,
        status: 'published',
      });

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}?strategy=new`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual([
        {
          id: childContent.id,
          owner_id: firstUser.id,
          parent_id: firstRootContent.id,
          slug: childContent.slug,
          title: null,
          body: 'Este conteúdo agora deverá aparecer na lista retornada pelo /contents/[username]',
          status: 'published',
          source_url: null,
          created_at: childContent.created_at.toISOString(),
          updated_at: childContent.updated_at.toISOString(),
          published_at: childContent.published_at.toISOString(),
          deleted_at: null,
          owner_username: firstUser.username,
          tabcoins: 0,
          children_deep_count: 0,
        },
        {
          id: secondRootContent.id,
          owner_id: firstUser.id,
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
          owner_username: firstUser.username,
          children_deep_count: 0,
        },
        {
          id: firstRootContent.id,
          owner_id: firstUser.id,
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
          owner_username: firstUser.username,
          children_deep_count: 1,
        },
      ]);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(uuidVersion(responseBody[0].owner_id)).toEqual(4);
      expect(uuidVersion(responseBody[1].owner_id)).toEqual(4);
      expect(responseBody[0].published_at > responseBody[1].published_at).toEqual(true);
    });

    test('"username" existent with 4 contents, but only 2 "root" "published"', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Primeiro conteúdo criado',
        status: 'published',
      });

      const secondRootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Segundo conteúdo criado',
        status: 'published',
      });

      const thirdRootContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Terceiro conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents/[username],
               porque quando um conteúdo possui o "status" como "draft", ele não
               esta pronto para ser listado publicamente.`,
        status: 'draft',
      });

      const childContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        parent_id: firstRootContent.id,
        title: 'Quarto conteúdo criado',
        body: `Este conteúdo que agora deverá aparecer na lista retornada pelo /contents/[username]`,
        status: 'published',
      });

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}?strategy=new`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual([
        {
          id: childContent.id,
          owner_id: firstUser.id,
          parent_id: firstRootContent.id,
          slug: 'quarto-conteudo-criado',
          title: 'Quarto conteúdo criado',
          body: 'Este conteúdo que agora deverá aparecer na lista retornada pelo /contents/[username]',
          status: 'published',
          source_url: null,
          created_at: childContent.created_at.toISOString(),
          updated_at: childContent.updated_at.toISOString(),
          published_at: childContent.published_at.toISOString(),
          deleted_at: null,
          owner_username: firstUser.username,
          tabcoins: 0,
          children_deep_count: 0,
        },
        {
          id: secondRootContent.id,
          owner_id: firstUser.id,
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
          owner_username: firstUser.username,
          children_deep_count: 0,
        },
        {
          id: firstRootContent.id,
          owner_id: firstUser.id,
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
          owner_username: firstUser.username,
          children_deep_count: 1,
        },
      ]);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(uuidVersion(responseBody[0].owner_id)).toEqual(4);
      expect(uuidVersion(responseBody[1].owner_id)).toEqual(4);
      expect(responseBody[0].published_at > responseBody[1].published_at).toEqual(true);
    });

    test('"username" existent with 60 contents, default pagination and strategy "new"', async () => {
      const defaultUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const numberOfContents = 60;
      const contentList = [];

      for (let item = 0; item < numberOfContents; item++) {
        const contentCreated = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });

        contentList.push(contentCreated);
      }

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: secondUserRootContent.id, // Conteúdo de outro usuário
        amount: 22,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[30].id, // Conteúdo #31
        amount: 12,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[35].id, // Conteúdo #36
        amount: 7,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[49].id, // Conteúdo #50
        amount: -2,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[50].id, // Conteúdo #51
        amount: -3,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[59].id, // Conteúdo #60
        amount: -1,
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}?strategy=new`);
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
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=new&page=1&per_page=30`,
        },
        next: {
          page: '2',
          per_page: '30',
          rel: 'next',
          strategy: 'new',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=new&page=2&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'new',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=new&page=2&per_page=30`,
        },
      });

      expect(responseBody.length).toEqual(30);
      expect(responseBody[0].title).toEqual('Conteúdo #60');
      expect(responseBody[1].title).toEqual('Conteúdo #59');
      expect(responseBody[2].title).toEqual('Conteúdo #58');
      expect(responseBody[15].title).toEqual('Conteúdo #45');
      expect(responseBody[27].title).toEqual('Conteúdo #33');
      expect(responseBody[28].title).toEqual('Conteúdo #32');
      expect(responseBody[29].title).toEqual('Conteúdo #31');

      const page2Response = await fetch(responseLinkHeader.next.url);
      const page2ResponseBody = await page2Response.json();

      const page2ResponseLinkHeader = parseLinkHeader(page2Response.headers.get('Link'));
      const page2ResponseTotalRowsHeader = page2Response.headers.get('X-Pagination-Total-Rows');

      expect(page2Response.status).toEqual(200);
      expect(page2ResponseTotalRowsHeader).toEqual('60');
      expect(page2ResponseLinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '30',
          rel: 'first',
          strategy: 'new',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=new&page=1&per_page=30`,
        },
        prev: {
          page: '1',
          per_page: '30',
          rel: 'prev',
          strategy: 'new',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=new&page=1&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'new',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=new&page=2&per_page=30`,
        },
      });

      expect(page2ResponseBody.length).toEqual(30);
      expect(page2ResponseBody[0].title).toEqual('Conteúdo #30');
      expect(page2ResponseBody[1].title).toEqual('Conteúdo #29');
      expect(page2ResponseBody[27].title).toEqual('Conteúdo #3');
      expect(page2ResponseBody[28].title).toEqual('Conteúdo #2');
      expect(page2ResponseBody[29].title).toEqual('Conteúdo #1');
    });

    test('"username" existent with 60 contents, default pagination and strategy "relevant"', async () => {
      const defaultUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const numberOfContents = 60;
      const contentList = [];

      for (let item = 0; item < numberOfContents; item++) {
        const contentCreated = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });

        contentList.push(contentCreated);
      }

      const secondUserRootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo de outro usuário',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: secondUserRootContent.id, // Conteúdo de outro usuário
        amount: 22,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[30].id, // Conteúdo #31
        amount: 12,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[35].id, // Conteúdo #36
        amount: 7,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[49].id, // Conteúdo #50
        amount: -2,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[50].id, // Conteúdo #51
        amount: -3,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin',
        recipientId: contentList[59].id, // Conteúdo #60
        amount: -1,
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}?strategy=relevant`
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
          strategy: 'relevant',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=relevant&page=1&per_page=30`,
        },
        next: {
          page: '2',
          per_page: '30',
          rel: 'next',
          strategy: 'relevant',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=relevant&page=2&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'relevant',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=relevant&page=2&per_page=30`,
        },
      });

      expect(responseBody.length).toEqual(30);
      expect(responseBody[0].title).toEqual('Conteúdo #31');
      expect(responseBody[1].title).toEqual('Conteúdo #36');
      expect(responseBody[2].title).toEqual('Conteúdo #59');
      expect(responseBody[3].title).toEqual('Conteúdo #58');
      expect(responseBody[6].title).toEqual('Conteúdo #55');
      expect(responseBody[26].title).toEqual('Conteúdo #32');
      expect(responseBody[27].title).toEqual('Conteúdo #60');
      expect(responseBody[28].title).toEqual('Conteúdo #50');
      expect(responseBody[29].title).toEqual('Conteúdo #51');

      const page2Response = await fetch(responseLinkHeader.next.url);
      const page2ResponseBody = await page2Response.json();

      const page2ResponseLinkHeader = parseLinkHeader(page2Response.headers.get('Link'));
      const page2ResponseTotalRowsHeader = page2Response.headers.get('X-Pagination-Total-Rows');

      expect(page2Response.status).toEqual(200);
      expect(page2ResponseTotalRowsHeader).toEqual('60');
      expect(page2ResponseLinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '30',
          rel: 'first',
          strategy: 'relevant',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=relevant&page=1&per_page=30`,
        },
        prev: {
          page: '1',
          per_page: '30',
          rel: 'prev',
          strategy: 'relevant',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=relevant&page=1&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'relevant',
          url: `http://localhost:3000/api/v1/contents/${defaultUser.username}?strategy=relevant&page=2&per_page=30`,
        },
      });

      expect(page2ResponseBody.length).toEqual(30);
      expect(page2ResponseBody[0].title).toEqual('Conteúdo #30');
      expect(page2ResponseBody[1].title).toEqual('Conteúdo #29');
      expect(page2ResponseBody[27].title).toEqual('Conteúdo #3');
      expect(page2ResponseBody[28].title).toEqual('Conteúdo #2');
      expect(page2ResponseBody[29].title).toEqual('Conteúdo #1');
    });
  });
});
