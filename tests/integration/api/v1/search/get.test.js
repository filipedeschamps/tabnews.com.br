import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/search', () => {
  describe('Anonymous user (dropAllTables beforeEach)', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });
    test('"q" is a required query params', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search`);
      const responseBody = await response.json();

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

    test('With invalid sort', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?q=test&sort=invalid`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"sort" deve possuir um dos seguintes valores: "new", "old", "relevant".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'sort',
        type: 'any.only',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With 1 "published" entries and sort "new"', async () => {
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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?q=primeiro&sort=new`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        rows: [
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
            path: [],
            tabcoins: 1,
            total_rows: 1,
            tabcoins_credit: 0,
            tabcoins_debit: 0,
            owner_username: defaultUser.username,
            children_deep_count: 1,
          },
        ],
        pagination: {
          currentPage: 1,
          totalRows: 1,
          perPage: 30,
          firstPage: 1,
          nextPage: null,
          previousPage: null,
          lastPage: 1,
        },
      });

      expect(uuidVersion(responseBody.rows[0].id)).toEqual(4);
      expect(uuidVersion(responseBody.rows[0].owner_id)).toEqual(4);
    });

    test('With 2 "published" entries and sort "relevant", expecting closest rank', async () => {
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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?q=${searchTerm}&sort=relevant`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual({
        rows: [
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
            path: [],
            owner_username: defaultUser.username,
            total_rows: 1,
            tabcoins: 1,
            tabcoins_credit: 0,
            tabcoins_debit: 0,
            children_deep_count: 0,
            rank: 1,
          },
        ],
        pagination: {
          currentPage: 1,
          totalRows: 1,
          perPage: 30,
          firstPage: 1,
          nextPage: null,
          previousPage: null,
          lastPage: 1,
        },
      });
      expect(responseBody.rows.length).toEqual(1);
      expect(responseBody.rows[0].id).toEqual(firstRootContent.id);
    });
  });
});
