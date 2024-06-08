import parseLinkHeader from 'parse-link-header';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents/[username]', () => {
  describe('Anonymous user', () => {
    test('"username" non-existent', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sponsored_contents/random`);
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: 'O "username" informado não foi encontrado no sistema.',
        action: 'Verifique se o "username" está digitado corretamente.',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND',
        key: 'username',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('"username" existent, but with no sponsored content', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Content',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: secondUser.id,
        amount: 10,
      });

      const createdSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: secondUser.id,
        title: 'Sponsored content',
        tabcash: 10,
      });

      await orchestrator.createContent({
        owner_id: firstUser.id,
        parent_id: createdSponsoredContent.content_id,
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sponsored_contents/${firstUser.username}`);
      const responseBody = await response.json();

      const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

      expect(response.status).toEqual(200);
      expect(responseTotalRowsHeader).toEqual('0');
      expect(responseBody).toEqual([]);
    });

    test('With two sponsored contents, but one deactivated', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: firstUser.id,
        amount: 20,
      });

      vi.useFakeTimers({
        now: new Date('2024-06-01T00:00:00.000Z'),
      });

      const firstSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: firstUser.id,
        title: 'Sponsored content',
        tabcash: 10,
        deactivate_at: new Date('2024-06-02'),
      });

      vi.advanceTimersByTime(1000);

      const firstContentUpdated = await orchestrator.updateContent(firstSponsoredContent.content_id, {
        body: 'Updated',
      });

      await orchestrator.createContent({
        owner_id: secondUser.id,
        body: 'Child',
        parent_id: firstSponsoredContent.content_id,
        status: 'published',
      });

      vi.useRealTimers();

      const secondSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: firstUser.id,
        title: 'An active sponsored content',
        tabcash: 10,
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sponsored_contents/${firstUser.username}`);
      const responseBody = await response.json();

      const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

      expect(response.status).toEqual(200);
      expect(responseTotalRowsHeader).toEqual('2');
      expect(responseBody).toEqual([
        {
          id: secondSponsoredContent.id,
          content_id: secondSponsoredContent.content_id,
          slug: secondSponsoredContent.slug,
          title: secondSponsoredContent.title,
          source_url: null,
          created_at: secondSponsoredContent.created_at.toISOString(),
          updated_at: secondSponsoredContent.updated_at.toISOString(),
          content_updated_at: secondSponsoredContent.updated_at.toISOString(),
          published_at: secondSponsoredContent.published_at.toISOString(),
          deactivate_at: null,
          owner_username: firstUser.username,
          tabcash: 10,
          tabcoins: 1,
          children_deep_count: 0,
        },
        {
          id: firstSponsoredContent.id,
          content_id: firstSponsoredContent.content_id,
          slug: firstSponsoredContent.slug,
          title: firstSponsoredContent.title,
          source_url: null,
          created_at: firstSponsoredContent.created_at.toISOString(),
          updated_at: firstSponsoredContent.updated_at.toISOString(),
          content_updated_at: firstContentUpdated.updated_at.toISOString(),
          published_at: firstSponsoredContent.published_at.toISOString(),
          deactivate_at: firstSponsoredContent.deactivate_at.toISOString(),
          owner_username: firstUser.username,
          tabcash: 10,
          tabcoins: 1,
          children_deep_count: 1,
        },
      ]);
    });

    test('With TabCoins credits and debits', async () => {
      const defaultUser = await orchestrator.createUser();

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 20,
      });

      const deactivate_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const defaultSponsoredContent = await orchestrator.createSponsoredContent({
        owner_id: defaultUser.id,
        title: 'An active sponsored content',
        tabcash: 20,
        deactivate_at: deactivate_at,
      });

      await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: defaultSponsoredContent.content_id,
        status: 'published',
      });

      await orchestrator.createRate(defaultSponsoredContent, 2);
      await orchestrator.createRate(defaultSponsoredContent, -3);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}`);
      const responseBody = await response.json();

      const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

      expect(response.status).toEqual(200);
      expect(responseTotalRowsHeader).toEqual('1');
      expect(responseBody).toEqual([
        {
          id: defaultSponsoredContent.id,
          content_id: defaultSponsoredContent.content_id,
          slug: defaultSponsoredContent.slug,
          title: defaultSponsoredContent.title,
          source_url: null,
          created_at: defaultSponsoredContent.created_at.toISOString(),
          updated_at: defaultSponsoredContent.updated_at.toISOString(),
          content_updated_at: defaultSponsoredContent.updated_at.toISOString(),
          published_at: defaultSponsoredContent.published_at.toISOString(),
          deactivate_at: deactivate_at.toISOString(),
          owner_username: defaultUser.username,
          tabcash: 14,
          tabcoins: 3,
          children_deep_count: 1,
        },
      ]);
    });

    describe('Pagination', () => {
      let defaultUser;
      const sponsoredContents = [];

      beforeAll(async () => {
        const totalSponsoredContents = 60;
        const tabcashPerContent = 10;

        defaultUser = await orchestrator.createUser();

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: totalSponsoredContents * tabcashPerContent,
        });

        vi.useFakeTimers({
          now: new Date('2024-06-01T00:00:00.000Z'),
        });

        for (let i = 1; i <= totalSponsoredContents; i++) {
          const duration = 60 * 60 * 1000;
          const deactivate_at = new Date(Date.now() + duration);

          const createdSponsoredContent = await orchestrator.createSponsoredContent({
            owner_id: defaultUser.id,
            title: `Sponsored content #${i}`,
            tabcash: tabcashPerContent,
            deactivate_at: deactivate_at,
          });
          sponsoredContents.unshift({
            id: createdSponsoredContent.id,
            content_id: createdSponsoredContent.content_id,
            slug: createdSponsoredContent.slug,
            title: createdSponsoredContent.title,
            source_url: null,
            created_at: createdSponsoredContent.created_at.toISOString(),
            updated_at: createdSponsoredContent.updated_at.toISOString(),
            content_updated_at: createdSponsoredContent.updated_at.toISOString(),
            published_at: createdSponsoredContent.published_at.toISOString(),
            deactivate_at: deactivate_at.toISOString(),
            owner_username: defaultUser.username,
            tabcash: tabcashPerContent,
            tabcoins: createdSponsoredContent.tabcoins,
            children_deep_count: 0,
          });

          vi.advanceTimersByTime(duration);
        }

        vi.useRealTimers();
      });

      test('First page with default page size', async () => {
        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}`);
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
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=1&per_page=30`,
          },
          next: {
            page: '2',
            per_page: '30',
            rel: 'next',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=30`,
          },
          last: {
            page: '2',
            per_page: '30',
            rel: 'last',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=30`,
          },
        });
        expect(responseBody).toEqual(sponsoredContents.slice(0, 30));
      });

      test('First page with page size of 40', async () => {
        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?per_page=40`,
        );
        const responseBody = await response.json();

        const responseLinkHeader = parseLinkHeader(response.headers.get('Link'));
        const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

        expect(response.status).toEqual(200);
        expect(responseTotalRowsHeader).toEqual('60');
        expect(responseLinkHeader).toStrictEqual({
          first: {
            page: '1',
            per_page: '40',
            rel: 'first',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=1&per_page=40`,
          },
          next: {
            page: '2',
            per_page: '40',
            rel: 'next',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=40`,
          },
          last: {
            page: '2',
            per_page: '40',
            rel: 'last',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=40`,
          },
        });
        expect(responseBody).toEqual(sponsoredContents.slice(0, 40));
      });

      test('Second page with page size of 40', async () => {
        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=40`,
        );
        const responseBody = await response.json();

        const responseLinkHeader = parseLinkHeader(response.headers.get('Link'));
        const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

        expect(response.status).toEqual(200);
        expect(responseTotalRowsHeader).toEqual('60');
        expect(responseLinkHeader).toStrictEqual({
          first: {
            page: '1',
            per_page: '40',
            rel: 'first',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=1&per_page=40`,
          },
          prev: {
            page: '1',
            per_page: '40',
            rel: 'prev',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=1&per_page=40`,
          },
          last: {
            page: '2',
            per_page: '40',
            rel: 'last',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=40`,
          },
        });
        expect(responseBody).toEqual(sponsoredContents.slice(40, 60));
      });

      test('A page that does not exist', async () => {
        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=3`,
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
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=1&per_page=30`,
          },
          prev: {
            page: '2',
            per_page: '30',
            rel: 'prev',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=30`,
          },
          last: {
            page: '2',
            per_page: '30',
            rel: 'last',
            url: `${orchestrator.webserverUrl}/api/v1/sponsored_contents/${defaultUser.username}?page=2&per_page=30`,
          },
        });
        expect(responseBody).toEqual([]);
      });
    });
  });
});
