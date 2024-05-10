import parseLinkHeader from 'parse-link-header';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents', () => {
  const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

  describe('Anonymous user (dropAllTables beforeEach)', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });

    test('With CORS and Security Headers enabled', async () => {
      const { response } = await contentsRequestBuilder.get();

      const responseHeaders = {};

      response.headers.forEach((value, key) => {
        responseHeaders[key] = [value];
      });

      const expectedHeaders = {
        'x-dns-prefetch-control': ['on'],
        'strict-transport-security': ['max-age=63072000; includeSubDomains; preload'],
        'x-xss-protection': ['1; mode=block'],
        'x-frame-options': ['SAMEORIGIN'],
        'permissions-policy': ['camera=(), microphone=(), geolocation=()'],
        'x-content-type-options': ['nosniff'],
        'referrer-policy': ['origin-when-cross-origin'],
        'access-control-allow-credentials': ['true'],
        'access-control-allow-origin': ['*'],
        'cache-control': ['public, s-maxage=10, stale-while-revalidate'],
        'access-control-allow-methods': ['GET,OPTIONS,PATCH,DELETE,POST,PUT'],
        'access-control-allow-headers': [
          'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
        ],
        link: [`<${orchestrator.webserverUrl}/api/v1/contents?strategy=relevant&page=1&per_page=30>; rel="first"`],
        'x-pagination-total-rows': ['0'],
        'content-type': ['application/json; charset=utf-8'],
        etag: responseHeaders.etag,
        'content-length': ['2'],
        vary: ['Accept-Encoding'],
        date: responseHeaders.date,
        connection: [expect.stringMatching(/^close$|^keep-alive$/)],
      };

      const expectedHeadersAlternative = {
        ...expectedHeaders,
        'keep-alive': [expect.stringMatching(/^timeout=/)],
      };

      expect([expectedHeaders, expectedHeadersAlternative]).toContainEqual(responseHeaders);
    });

    test('With no content', async () => {
      const { response, responseBody } = await contentsRequestBuilder.get();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('With invalid strategy', async () => {
      const { response, responseBody } = await contentsRequestBuilder.get(`?strategy=invalid`);

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

    test('With 2 "published" entries and strategy "new"', async () => {
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

      // thirdRootContent
      await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Terceiro conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
               porque quando um conteúdo possui o "status" como "draft", ele não
               esta pronto para ser listado publicamente.`,
        status: 'draft',
      });

      // NotRootContentPublished
      await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Quarto conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
               porque quando um conteúdo possui um "parent_id",
               significa que ele é uma resposta a um outro conteúdo.`,
        status: 'published',
      });

      // NotRootContentDraft
      await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Quinto conteúdo criado',
        body: `Este conteúdo não somente não deve aparecer na lista principal,
               como também não deve ser contabilizado no "children_deep_count".`,
        status: 'draft',
      });

      const { response, responseBody } = await contentsRequestBuilder.get(`?strategy=new`);

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
          tabcoins_credit: 0,
          tabcoins_debit: 0,
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
          tabcoins_credit: 0,
          tabcoins_debit: 0,
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

    test('With 2 "published" entries and strategy "old"', async () => {
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

      // thirdRootContent
      await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Terceiro conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
               porque quando um conteúdo possui o "status" como "draft", ele não
               esta pronto para ser listado publicamente.`,
        status: 'draft',
      });

      // NotRootContentPublished
      await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Quarto conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
               porque quando um conteúdo possui um "parent_id",
               significa que ele é uma resposta a um outro conteúdo.`,
        status: 'published',
      });

      // NotRootContentDraft
      await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Quinto conteúdo criado',
        body: `Este conteúdo não somente não deve aparecer na lista principal,
               como também não deve ser contabilizado no "children_deep_count".`,
        status: 'draft',
      });

      const { response, responseBody } = await contentsRequestBuilder.get(`?strategy=old`);

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
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
          children_deep_count: 1,
        },
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
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
          children_deep_count: 0,
        },
      ]);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(uuidVersion(responseBody[0].owner_id)).toEqual(4);
      expect(uuidVersion(responseBody[1].owner_id)).toEqual(4);
      expect(responseBody[1].published_at > responseBody[0].published_at).toEqual(true);
    });

    test('With 3 children 3 level deep and default strategy', async () => {
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

      // level3Content
      await orchestrator.createContent({
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

      const { response, responseBody } = await contentsRequestBuilder.get();

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
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
          children_deep_count: 3,
        },
      ]);
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
      const { response, responseBody } = await contentsRequestBuilder.get(`?strategy=new`);

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
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=1&per_page=30`,
        },
        next: {
          page: '2',
          per_page: '30',
          rel: 'next',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=2&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=2&per_page=30`,
        },
      });

      expect(responseBody.length).toEqual(30);
      expect(responseBody[0].title).toEqual('Conteúdo #60');
      expect(responseBody[29].title).toEqual('Conteúdo #31');
    });

    test('With 60 entries, default "page", "per_page" and strategy "relevant" (default)', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      const thirdUser = await orchestrator.createUser();

      const numberOfContents = 60;
      const contentList = [];

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: firstUser.id,
          title: `Conteúdo #1`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createContent({
        owner_id: firstUser.id,
        body: 'Comment #10',
        status: 'published',
        parent_id: contentList[0].id,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[0].id, // Conteúdo #1
        amount: 10, // -> with recent comment, but same user
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 days ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: firstUser.id,
          title: `Conteúdo #2`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createContent({
        owner_id: secondUser.id,
        body: 'Comment #11',
        status: 'published',
        parent_id: contentList[1].id,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[1].id, // Conteúdo #2
        amount: 10, // -> score = 33, more than 7 days ago, but with recent comment
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: firstUser.id,
          title: `Conteúdo #3`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createContent({
        owner_id: secondUser.id,
        body: 'Comment #12',
        status: 'published',
        parent_id: contentList[2].id,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[2].id, // Conteúdo #3
        amount: 9, // -> score = 30, more than 7 days ago, but with recent comment
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: firstUser.id,
          title: `Conteúdo #4`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[3].id, // Conteúdo #4
        amount: 9, // -> score = 30, but more than 7 days ago
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: secondUser.id,
          title: `Conteúdo #5`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[4].id, // Conteúdo #5
        amount: 8, // -> score = 27 and 3 days ago -> group_6
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 35), // 35 hours ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: thirdUser.id,
          title: `Conteúdo #6`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[5].id, // Conteúdo #6
        amount: 3, // score = 12 and less than 36 hours -> group_4
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 37), // 37 hours ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: firstUser.id,
          title: `Conteúdo #7`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[6].id, // Conteúdo #7
        amount: 4, // score = 15 and more than 37 hours -> group_5
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: secondUser.id,
          title: `Conteúdo #8`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[7].id, // Conteúdo #8
        amount: 4, // score = 15 and more than 36 hours -> group_5
      });

      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24), // 24 hours ago
      });

      contentList.push(
        await orchestrator.createContent({
          owner_id: thirdUser.id,
          title: `Conteúdo #9`,
          status: 'published',
        }),
      );

      vi.useRealTimers();

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[8].id, // Conteúdo #9
        amount: 2, // score = 9 and more than 24 hours -> group_5
      });

      for (let item = 9; item < numberOfContents; item = item + 3) {
        contentList.push(
          await orchestrator.createContent({
            owner_id: firstUser.id,
            title: `Conteúdo #${item + 1}`,
            status: 'published',
          }),
        );

        contentList.push(
          await orchestrator.createContent({
            owner_id: secondUser.id,
            title: `Conteúdo #${item + 2}`,
            status: 'published',
          }),
        );

        contentList.push(
          await orchestrator.createContent({
            owner_id: thirdUser.id,
            title: `Conteúdo #${item + 3}`,
            status: 'published',
          }),
        );
      }

      await orchestrator.createContent({
        owner_id: firstUser.id,
        body: 'Comment #1',
        status: 'published',
        parent_id: contentList[44].id, // Conteúdo #45 -> score = 3
      });

      await orchestrator.createContent({
        owner_id: secondUser.id,
        body: 'Comment #2',
        status: 'published',
        parent_id: contentList[44].id, // Conteúdo #45 -> score = 4
      });

      // Comment on own content should not count towards the score
      await orchestrator.createContent({
        owner_id: thirdUser.id,
        body: 'Comment #3',
        status: 'published',
        parent_id: contentList[44].id, // Conteúdo #45 -> score = 4
      });

      await orchestrator.createContent({
        owner_id: firstUser.id,
        body: 'Comment #4',
        status: 'published',
        parent_id: contentList[47].id, // Conteúdo #48 -> score = 3
      });

      await orchestrator.createContent({
        owner_id: secondUser.id,
        body: 'Comment #5',
        status: 'published',
        parent_id: contentList[47].id, // Conteúdo #48 -> score = 4
      });

      await orchestrator.createContent({
        owner_id: firstUser.id,
        body: 'Comment #6',
        status: 'published',
        parent_id: contentList[52].id, // Conteúdo #53 -> score = 3
      });

      // More than one comment from the same user should not count towards the score
      await orchestrator.createContent({
        owner_id: firstUser.id,
        body: 'Comment #7',
        status: 'published',
        parent_id: contentList[52].id, // Conteúdo #53 -> score = 3
      });

      await orchestrator.createContent({
        owner_id: firstUser.id,
        body: 'Comment #8',
        status: 'published',
        parent_id: contentList[52].id, // Conteúdo #53 -> score = 3
      });

      await orchestrator.createContent({
        owner_id: thirdUser.id,
        body: 'Comment #9',
        status: 'published',
        parent_id: contentList[51].id, // Conteúdo #52 -> score = 3
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[30].id, // Conteúdo #31
        amount: 5, // score = 18 -> group_1
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:credit',
        recipientId: contentList[35].id, // Conteúdo #36
        amount: 2, // score = 9 -> group_2
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:debit',
        recipientId: contentList[49].id, // Conteúdo #50
        amount: -2,
      });

      await orchestrator.createBalance({
        balanceType: 'content:tabcoin:debit',
        recipientId: contentList[50].id, // Conteúdo #51
        amount: -3,
      });

      const { response, responseBody } = await contentsRequestBuilder.get();

      const responseLinkHeader = parseLinkHeader(response.headers.get('Link'));
      const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

      expect(response.status).toEqual(200);
      expect(responseTotalRowsHeader).toEqual('56');
      expect(responseLinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '30',
          rel: 'first',
          strategy: 'relevant',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=relevant&page=1&per_page=30`,
        },
        next: {
          page: '2',
          per_page: '30',
          rel: 'next',
          strategy: 'relevant',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=relevant&page=2&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'relevant',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=relevant&page=2&per_page=30`,
        },
      });

      expect(responseBody.length).toEqual(30);

      // group_1 -> score > 16 and less than 36 hours ago
      expect(responseBody[0].title).toEqual('Conteúdo #31');

      // group_2 -> score > 8 and less than 24 hours ago
      expect(responseBody[1].title).toEqual('Conteúdo #36');

      // group_3 -> max one new content by user with less than 12 hours
      expect(responseBody[2].title).toEqual('Conteúdo #60');
      expect(responseBody[3].title).toEqual('Conteúdo #59');
      expect(responseBody[4].title).toEqual('Conteúdo #58');

      // group_4 -> score > 11 and less than 36 hours ago
      expect(responseBody[5].title).toEqual('Conteúdo #6');

      // group_5 -> score > 8 and less than 3 days ago
      expect(responseBody[6].title).toEqual('Conteúdo #8');
      expect(responseBody[7].title).toEqual('Conteúdo #7');
      expect(responseBody[8].title).toEqual('Conteúdo #9');

      // group_6 -> tabcoins > 0 and less than 7 days ago
      // or commented less than 24 hours
      expect(responseBody[9].title).toEqual('Conteúdo #2');
      expect(responseBody[10].title).toEqual('Conteúdo #3');
      expect(responseBody[11].title).toEqual('Conteúdo #5');
      expect(responseBody[12].title).toEqual('Conteúdo #48');
      expect(responseBody[13].title).toEqual('Conteúdo #45');
      expect(responseBody[14].title).toEqual('Conteúdo #53');
      expect(responseBody[15].title).toEqual('Conteúdo #52');
      expect(responseBody[16].title).toEqual('Conteúdo #57');
      expect(responseBody[19].title).toEqual('Conteúdo #54');
      expect(responseBody[20].title).toEqual('Conteúdo #49');
      expect(responseBody[21].title).toEqual('Conteúdo #47');
      expect(responseBody[22].title).toEqual('Conteúdo #46');
      expect(responseBody[23].title).toEqual('Conteúdo #44');
      expect(responseBody[29].title).toEqual('Conteúdo #38');

      const page2RequestBuilder = new RequestBuilder(responseLinkHeader.next.url);
      const { response: page2Response, responseBody: page2ResponseBody } = await page2RequestBuilder.get();

      const page2ResponseLinkHeader = parseLinkHeader(page2Response.headers.get('Link'));
      const page2ResponseTotalRowsHeader = page2Response.headers.get('X-Pagination-Total-Rows');

      expect(page2Response.status).toEqual(200);
      expect(page2ResponseTotalRowsHeader).toEqual('56');
      expect(page2ResponseLinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '30',
          rel: 'first',
          strategy: 'relevant',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=relevant&page=1&per_page=30`,
        },
        prev: {
          page: '1',
          per_page: '30',
          rel: 'prev',
          strategy: 'relevant',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=relevant&page=1&per_page=30`,
        },
        last: {
          page: '2',
          per_page: '30',
          rel: 'last',
          strategy: 'relevant',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=relevant&page=2&per_page=30`,
        },
      });

      expect(page2ResponseBody.length).toEqual(26);
      expect(page2ResponseBody[0].title).toEqual('Conteúdo #37');
      expect(page2ResponseBody[1].title).toEqual('Conteúdo #35');
      expect(page2ResponseBody[2].title).toEqual('Conteúdo #34');
      expect(page2ResponseBody[3].title).toEqual('Conteúdo #33');
      expect(page2ResponseBody[24].title).toEqual('Conteúdo #11');
      expect(page2ResponseBody[25].title).toEqual('Conteúdo #10');
    });

    test('With 9 entries, custom "page", "per_page" and strategy "new" (navigating using Link Header)', async () => {
      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 9;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });
      }

      const { response: page1, responseBody: page1Body } = await contentsRequestBuilder.get(
        `?page=1&per_page=3&strategy=new`,
      );

      const page1LinkHeader = parseLinkHeader(page1.headers.get('Link'));
      const page1TotalRowsHeader = page1.headers.get('X-Pagination-Total-Rows');

      expect(page1.status).toEqual(200);
      expect(page1TotalRowsHeader).toEqual('9');
      expect(page1LinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '3',
          rel: 'first',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=1&per_page=3`,
        },
        next: {
          page: '2',
          per_page: '3',
          rel: 'next',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=2&per_page=3`,
        },
        last: {
          page: '3',
          per_page: '3',
          rel: 'last',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=3&per_page=3`,
        },
      });

      expect(page1Body.length).toEqual(3);
      expect(page1Body[0].title).toEqual('Conteúdo #9');
      expect(page1Body[1].title).toEqual('Conteúdo #8');
      expect(page1Body[2].title).toEqual('Conteúdo #7');

      const page2RequestBuilder = new RequestBuilder(page1LinkHeader.next.url);
      const { response: page2, responseBody: page2Body } = await page2RequestBuilder.get();

      const page2LinkHeader = parseLinkHeader(page2.headers.get('Link'));
      const page2TotalRowsHeader = page2.headers.get('X-Pagination-Total-Rows');

      expect(page2.status).toEqual(200);
      expect(page2TotalRowsHeader).toEqual('9');
      expect(page2LinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '3',
          rel: 'first',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=1&per_page=3`,
        },
        prev: {
          page: '1',
          per_page: '3',
          rel: 'prev',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=1&per_page=3`,
        },
        next: {
          page: '3',
          per_page: '3',
          rel: 'next',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=3&per_page=3`,
        },
        last: {
          page: '3',
          per_page: '3',
          rel: 'last',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=3&per_page=3`,
        },
      });

      expect(page2Body.length).toEqual(3);
      expect(page2Body[0].title).toEqual('Conteúdo #6');
      expect(page2Body[1].title).toEqual('Conteúdo #5');
      expect(page2Body[2].title).toEqual('Conteúdo #4');

      const page3RequestBuilder = new RequestBuilder(page2LinkHeader.next.url);
      const { response: page3, responseBody: page3Body } = await page3RequestBuilder.get();

      const page3LinkHeader = parseLinkHeader(page3.headers.get('Link'));
      const page3TotalRowsHeader = page3.headers.get('X-Pagination-Total-Rows');

      expect(page3.status).toEqual(200);
      expect(page3TotalRowsHeader).toEqual('9');
      expect(page3LinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '3',
          rel: 'first',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=1&per_page=3`,
        },
        prev: {
          page: '2',
          per_page: '3',
          rel: 'prev',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=2&per_page=3`,
        },
        last: {
          page: '3',
          per_page: '3',
          rel: 'last',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=3&per_page=3`,
        },
      });

      expect(page3Body.length).toEqual(3);
      expect(page3Body[0].title).toEqual('Conteúdo #3');
      expect(page3Body[1].title).toEqual('Conteúdo #2');
      expect(page3Body[2].title).toEqual('Conteúdo #1');

      // FIRST AND LAST PAGE USING "PAGE 1" LINK HEADER
      const firstPageRequestBuilder = new RequestBuilder(page1LinkHeader.first.url);
      const { response: firstPage, responseBody: firstPageBody } = await firstPageRequestBuilder.get();
      const firstPageLinkHeader = parseLinkHeader(firstPage.headers.get('Link'));
      const firstPageTotalRowsHeader = firstPage.headers.get('X-Pagination-Total-Rows');

      expect(firstPage.status).toEqual(200);
      expect(firstPageTotalRowsHeader).toEqual(page1TotalRowsHeader);
      expect(firstPageLinkHeader).toStrictEqual(page1LinkHeader);
      expect(firstPageBody).toEqual(page1Body);

      const lastPageRequestBuilder = new RequestBuilder(page1LinkHeader.last.url);
      const { response: lastPage, responseBody: lastPageBody } = await lastPageRequestBuilder.get();
      const lastPageLinkHeader = parseLinkHeader(lastPage.headers.get('Link'));
      const lastPageTotalRowsHeader = lastPage.headers.get('X-Pagination-Total-Rows');

      expect(lastPage.status).toEqual(200);
      expect(lastPageTotalRowsHeader).toEqual(page3TotalRowsHeader);
      expect(lastPageLinkHeader).toStrictEqual(page3LinkHeader);
      expect(lastPageBody).toEqual(page3Body);
    });

    test('With 9 entries but "page" out of bounds and strategy "new"', async () => {
      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 9;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });
      }

      const { response: page4, responseBody: page4Body } = await contentsRequestBuilder.get(
        '?strategy=new&page=4&per_page=3',
      );

      const page4LinkHeader = parseLinkHeader(page4.headers.get('Link'));
      const page4TotalRowsHeader = page4.headers.get('X-Pagination-Total-Rows');

      expect(page4.status).toEqual(200);
      expect(page4TotalRowsHeader).toEqual('9');
      expect(page4LinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '3',
          rel: 'first',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=1&per_page=3`,
        },
        prev: {
          page: '3',
          per_page: '3',
          rel: 'prev',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=3&per_page=3`,
        },
        last: {
          page: '3',
          per_page: '3',
          rel: 'last',
          strategy: 'new',
          url: `${orchestrator.webserverUrl}/api/v1/contents?strategy=new&page=3&per_page=3`,
        },
      });

      expect(page4Body.length).toEqual(0);
    });

    test('With "page" with a String', async () => {
      const { response, responseBody } = await contentsRequestBuilder.get('?page=CINCO');

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
      const { response, responseBody } = await contentsRequestBuilder.get('?page=0');

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
      const { response, responseBody } = await contentsRequestBuilder.get('?page=9007199254740991');

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
      const { response, responseBody } = await contentsRequestBuilder.get('?page=9007199254740992');

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: `"page" deve possuir um valor entre 1 e 9007199254740990.`,
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
      const { response, responseBody } = await contentsRequestBuilder.get('?page=1.5');

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
      const { response, responseBody } = await contentsRequestBuilder.get('?per_page=SEIS');

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
      const { response, responseBody } = await contentsRequestBuilder.get('?per_page=0');

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
      const { response, responseBody } = await contentsRequestBuilder.get('?per_page=9007199254740991');

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
      const { response, responseBody } = await contentsRequestBuilder.get('?per_page=9007199254740992');

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve possuir um valor entre 1 e 100.',
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
      const { response, responseBody } = await contentsRequestBuilder.get('?per_page=1.5');

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

  describe('Anonymous user (dropAllTables beforeAll)', () => {
    describe('with_children and with_root using different strategies', () => {
      const rootSortedByOld = [];
      const childSortedByOld = [];
      const rootSortedByNew = [];
      const childSortedByNew = [];
      const rootSortedByTabCoins = [];
      const childSortedByTabCoins = [];

      beforeAll(async () => {
        await orchestrator.dropAllTables();
        await orchestrator.runPendingMigrations();

        const createUser = async () => orchestrator.createUser();
        const createContent = async (user, options) => orchestrator.createContent({ owner_id: user.id, ...options });
        const createComment = async (user, parent, body) =>
          createContent(user, { body, status: 'published', parent_id: parent.id });

        const [firstUser, secondUser, thirdUser] = await Promise.all(Array.from({ length: 3 }, () => createUser()));

        await createContent(firstUser, { title: 'Conteúdo "Draft"', status: 'draft' });

        const firstRootContent = await createContent(secondUser, {
          title: 'Primeiro conteúdo criado',
          status: 'published',
        });

        rootSortedByOld.push({
          id: firstRootContent.id,
          owner_id: secondUser.id,
          parent_id: null,
          slug: 'primeiro-conteudo-criado',
          title: 'Primeiro conteúdo criado',
          status: 'published',
          source_url: null,
          created_at: firstRootContent.created_at.toISOString(),
          updated_at: firstRootContent.updated_at.toISOString(),
          published_at: firstRootContent.published_at.toISOString(),
          deleted_at: null,
          owner_username: secondUser.username,
          tabcoins: 2,
          tabcoins_credit: 1,
          tabcoins_debit: 0,
          children_deep_count: 1,
        });

        await orchestrator.createRate(firstRootContent, 1);

        const secondRootContent = await createContent(thirdUser, {
          title: 'Segundo conteúdo criado',
          status: 'published',
        });

        rootSortedByOld.push({
          id: secondRootContent.id,
          owner_id: thirdUser.id,
          parent_id: null,
          slug: 'segundo-conteudo-criado',
          title: 'Segundo conteúdo criado',
          status: 'published',
          source_url: null,
          created_at: secondRootContent.created_at.toISOString(),
          updated_at: secondRootContent.updated_at.toISOString(),
          published_at: secondRootContent.published_at.toISOString(),
          deleted_at: null,
          owner_username: thirdUser.username,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          children_deep_count: 1,
        });

        const firstComment = await createComment(firstUser, secondRootContent, 'Comentário #1');
        const secondComment = await createComment(thirdUser, firstRootContent, 'Comentário #2');
        await orchestrator.createRate(firstComment, 1);

        function createCommentExpect(comment, owner, parent, tabcoins = 0) {
          return {
            id: comment.id,
            owner_id: owner.id,
            parent_id: parent.id,
            slug: comment.slug,
            title: null,
            body: comment.body,
            status: 'published',
            source_url: null,
            created_at: comment.created_at.toISOString(),
            updated_at: comment.updated_at.toISOString(),
            published_at: comment.published_at.toISOString(),
            deleted_at: null,
            owner_username: owner.username,
            tabcoins,
            tabcoins_credit: tabcoins,
            tabcoins_debit: 0,
            children_deep_count: 0,
          };
        }

        childSortedByOld.push(
          createCommentExpect(firstComment, firstUser, secondRootContent, 1),
          createCommentExpect(secondComment, thirdUser, firstRootContent),
        );

        rootSortedByNew.push(...rootSortedByOld.slice().reverse());
        childSortedByNew.push(...childSortedByOld.slice().reverse());

        rootSortedByTabCoins.push(...rootSortedByNew.slice().sort((a, b) => b.tabcoins - a.tabcoins));
        childSortedByTabCoins.push(...childSortedByNew.slice().sort((a, b) => b.tabcoins - a.tabcoins));
      });

      test.each([
        {
          content: 'relevant root',
          params: [],
          getExpected: () => rootSortedByTabCoins,
        },
        {
          content: 'relevant root',
          params: ['with_children=false'],
          getExpected: () => rootSortedByTabCoins,
        },
        {
          content: 'relevant root and children',
          params: ['with_children=true'],
          getExpected: () => [
            rootSortedByTabCoins[0],
            childSortedByTabCoins[0],
            rootSortedByTabCoins[1],
            childSortedByTabCoins[1],
          ],
        },
        {
          content: 'new root',
          params: ['with_children=false', 'with_root=true', 'strategy=new'],
          getExpected: () => rootSortedByNew,
        },
        {
          content: 'new root',
          params: ['with_children=false', 'with_root=true', 'strategy=new'],
          getExpected: () => rootSortedByNew,
        },
        {
          content: 'new children',
          params: ['with_children=true', 'with_root=false', 'strategy=new'],
          getExpected: () => childSortedByNew,
        },
        {
          content: 'new root and children',
          params: ['with_children=true', 'strategy=new'],
          getExpected: () => [...childSortedByNew, ...rootSortedByNew],
        },
        {
          content: 'new root and children',
          params: ['with_children=true', 'with_root=true', 'strategy=new'],
          getExpected: () => [...childSortedByNew, ...rootSortedByNew],
        },
        {
          content: 'new root',
          params: ['with_root=true', 'strategy=new'],
          getExpected: () => rootSortedByNew,
        },
      ])('get $content with params: $params', async ({ params, getExpected }) => {
        const { response, responseBody } = await contentsRequestBuilder.get(`?${params.join('&')}`);

        expect(response.status).toEqual(200);
        expect(responseBody).toStrictEqual(getExpected());
      });
    });
  });
});
