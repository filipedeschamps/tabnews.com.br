import parseLinkHeader from 'parse-link-header';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

let firstUser;
let secondUser;
let privilegedUser;
let privilegedUserSession;
let defaultUser;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();

  firstUser = await orchestrator.createUser();
  firstUser = await orchestrator.activateUser(firstUser);
  defaultUser = firstUser;

  secondUser = await orchestrator.createUser();
  await orchestrator.activateUser(secondUser);
  secondUser = await orchestrator.addFeaturesToUser(secondUser, ['read:user:list']);
  privilegedUser = secondUser;
  privilegedUserSession = await orchestrator.createSession(privilegedUser);
});

describe('GET /api/v1/users', () => {
  describe('Anonymous user', () => {
    test('Anonymous user trying to retrieve user list', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`);
      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:user:list".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('Default user', () => {
    test('User without "read:user:list" feature', async () => {
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });
      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:user:list".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('User with "read:user:list" feature', () => {
    test('With a large value for "per_page"', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users?per_page=150`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });
      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
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

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an invalid value for "page"', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=first`);
      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

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

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('Retrieving user list with 2 users', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });
      const responseBody = await response.json();

      const responseLinkHeader = parseLinkHeader(response.headers.get('Link'));
      const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

      expect.soft(response.status).toBe(200);
      expect(responseTotalRowsHeader).toBe('2');
      expect(responseLinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '30',
          rel: 'first',
          url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
        },
        last: {
          page: '1',
          per_page: '30',
          rel: 'last',
          url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
        },
      });

      expect(responseBody).toStrictEqual([
        {
          id: secondUser.id,
          username: secondUser.username,
          description: secondUser.description,
          features: secondUser.features,
          tabcoins: 0,
          tabcash: 0,
          created_at: secondUser.created_at.toISOString(),
          updated_at: secondUser.updated_at.toISOString(),
        },
        {
          id: firstUser.id,
          username: firstUser.username,
          description: firstUser.description,
          features: firstUser.features,
          tabcoins: 0,
          tabcash: 0,
          created_at: firstUser.created_at.toISOString(),
          updated_at: firstUser.updated_at.toISOString(),
        },
      ]);

      expect(uuidVersion(responseBody[0].id)).toBe(4);
      expect(Date.parse(responseBody[0].created_at)).not.toBeNaN();
      expect(Date.parse(responseBody[0].updated_at)).not.toBeNaN();

      expect(uuidVersion(responseBody[1].id)).toBe(4);
      expect(Date.parse(responseBody[1].created_at)).not.toBeNaN();
      expect(Date.parse(responseBody[1].updated_at)).not.toBeNaN();
    });

    test('Retrieving user list with TabCoins and TabCash', async () => {
      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: firstUser.id,
        amount: 8,
      });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: firstUser.id,
        amount: 3,
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: -2,
      });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: secondUser.id,
        amount: 200,
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });
      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual([
        {
          id: secondUser.id,
          username: secondUser.username,
          description: secondUser.description,
          features: secondUser.features,
          tabcoins: -2,
          tabcash: 200,
          created_at: secondUser.created_at.toISOString(),
          updated_at: secondUser.updated_at.toISOString(),
        },
        {
          id: firstUser.id,
          username: firstUser.username,
          description: firstUser.description,
          features: firstUser.features,
          tabcoins: 8,
          tabcash: 3,
          created_at: firstUser.created_at.toISOString(),
          updated_at: firstUser.updated_at.toISOString(),
        },
      ]);

      expect(uuidVersion(responseBody[0].id)).toBe(4);
      expect(Date.parse(responseBody[0].created_at)).not.toBeNaN();
      expect(Date.parse(responseBody[0].updated_at)).not.toBeNaN();

      expect(uuidVersion(responseBody[1].id)).toBe(4);
      expect(Date.parse(responseBody[1].created_at)).not.toBeNaN();
      expect(Date.parse(responseBody[1].updated_at)).not.toBeNaN();
    });

    test('With a "page" out of bounds', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users?page=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },
      });
      const responseBody = await response.json();

      const responseLinkHeader = parseLinkHeader(response.headers.get('Link'));
      const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

      expect.soft(response.status).toBe(200);
      expect(responseTotalRowsHeader).toBe('2');
      expect(responseLinkHeader).toStrictEqual({
        first: {
          page: '1',
          per_page: '30',
          rel: 'first',
          url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
        },
        prev: {
          page: '1',
          per_page: '30',
          rel: 'prev',
          url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
        },
        last: {
          page: '1',
          per_page: '30',
          rel: 'last',
          url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
        },
      });

      expect(responseBody).toStrictEqual([]);
    });
  });

  describe('User with "read:user:list" feature (dropAllTables beforeAll)', () => {
    describe('With 60 users', () => {
      const sortedByRecentlyUpdated = [];

      let privilegedUserSession;

      beforeAll(async () => {
        await orchestrator.dropAllTables();
        await orchestrator.runPendingMigrations();

        const numberOfUsers = 60;
        const sortedByNew = [];

        for (let index = 0; index < numberOfUsers; index++) {
          const user = await orchestrator.createUser({
            username: `user${index + 1}`,
          });
          sortedByNew.unshift({
            id: user.id,
            username: user.username,
            description: user.description,
            features: user.features,
            tabcoins: 0,
            tabcash: 0,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
          });
        }

        // Oldest user will have 'read:user:list' feature
        await orchestrator.activateUser(sortedByNew.at(-1));
        let privilegedUser = await orchestrator.addFeaturesToUser(sortedByNew.at(-1), ['read:user:list']);
        privilegedUserSession = await orchestrator.createSession(privilegedUser);
        privilegedUser = {
          id: privilegedUser.id,
          username: privilegedUser.username,
          description: privilegedUser.description,
          features: privilegedUser.features,
          tabcoins: 0,
          tabcash: 0,
          created_at: privilegedUser.created_at.toISOString(),
          updated_at: privilegedUser.updated_at.toISOString(),
        };

        sortedByNew.pop();
        sortedByNew.push(privilegedUser);

        let updatedUser50 = await orchestrator.activateUser(sortedByNew.at(-49));
        updatedUser50 = {
          ...sortedByNew.at(-49),
          features: updatedUser50.features,
          updated_at: updatedUser50.updated_at.toISOString(),
        };

        sortedByRecentlyUpdated.push(...sortedByNew);

        const indexOfUpdatedUser1 = sortedByRecentlyUpdated.findIndex((user) => user.id === privilegedUser.id);
        const indexOfUpdatedUser50 = sortedByRecentlyUpdated.findIndex((user) => user.id === updatedUser50.id);

        sortedByRecentlyUpdated.splice(indexOfUpdatedUser1, 1);
        sortedByRecentlyUpdated.splice(indexOfUpdatedUser50, 1);

        sortedByRecentlyUpdated.unshift(privilegedUser);
        sortedByRecentlyUpdated.unshift(updatedUser50);
      });

      test('Navigating to next page', async () => {
        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${privilegedUserSession.token}`,
          },
        });
        const responseBody = await response.json();

        const responseLinkHeader = parseLinkHeader(response.headers.get('Link'));
        const responseTotalRowsHeader = response.headers.get('X-Pagination-Total-Rows');

        expect.soft(response.status).toBe(200);
        expect(responseTotalRowsHeader).toBe('60');
        expect(responseLinkHeader).toStrictEqual({
          first: {
            page: '1',
            per_page: '30',
            rel: 'first',
            url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
          },
          next: {
            page: '2',
            per_page: '30',
            rel: 'next',
            url: `${orchestrator.webserverUrl}/api/v1/users?page=2&per_page=30`,
          },
          last: {
            page: '2',
            per_page: '30',
            rel: 'last',
            url: `${orchestrator.webserverUrl}/api/v1/users?page=2&per_page=30`,
          },
        });

        expect(responseBody).toStrictEqual(sortedByRecentlyUpdated.slice(0, 30));

        const page2Response = await fetch(responseLinkHeader.next.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${privilegedUserSession.token}`,
          },
        });
        const page2ResponseBody = await page2Response.json();

        const page2ResponseLinkHeader = parseLinkHeader(page2Response.headers.get('Link'));
        const page2ResponseTotalRowsHeader = page2Response.headers.get('X-Pagination-Total-Rows');

        expect.soft(page2Response.status).toBe(200);
        expect(page2ResponseTotalRowsHeader).toBe('60');
        expect(page2ResponseLinkHeader).toStrictEqual({
          first: {
            page: '1',
            per_page: '30',
            rel: 'first',
            url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
          },
          prev: {
            page: '1',
            per_page: '30',
            rel: 'prev',
            url: `${orchestrator.webserverUrl}/api/v1/users?page=1&per_page=30`,
          },
          last: {
            page: '2',
            per_page: '30',
            rel: 'last',
            url: `${orchestrator.webserverUrl}/api/v1/users?page=2&per_page=30`,
          },
        });

        expect(page2ResponseBody).toStrictEqual(sortedByRecentlyUpdated.slice(30));
      });

      test.each([
        {
          content: 'most recently updated users first',
          params: [],
          getExpected: () => sortedByRecentlyUpdated.slice(0, 30),
        },
        {
          content: 'first 15 users',
          params: ['per_page=15'],
          getExpected: () => sortedByRecentlyUpdated.slice(0, 15),
        },
        {
          content: 'second page with 10 users',
          params: ['per_page=10', 'page=2'],
          getExpected: () => sortedByRecentlyUpdated.slice(10, 20),
        },
      ])('Retrieving $content with params: $params', async ({ params, getExpected }) => {
        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users?${params.join('&')}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${privilegedUserSession.token}`,
          },
        });

        const responseBody = await response.json();

        expect.soft(response.status).toBe(200);
        expect(responseBody).toStrictEqual(getExpected());
      });
    });
  });
});
