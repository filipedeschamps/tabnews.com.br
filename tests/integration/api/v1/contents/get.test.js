import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents', () => {
  describe('Anonymous user', () => {
    test('With no content', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('With 2 entries and default strategy "descending"', async () => {
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
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
               porque quando um conteúdo possui o "status" como "draft", ele não
               esta pronto para ser listado publicamente.`,
        status: 'draft',
      });

      const NotRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Quarto conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
               porque quando um conteúdo possui um "parent_id",
               significa que ele é uma resposta a um outro conteúdo.`,
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.length).toEqual(2);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(responseBody[0].owner_id).toEqual(defaultUser.id);
      expect(responseBody[0].username).toEqual(defaultUser.username);
      expect(responseBody[0].parent_id).toEqual(secondRootContent.parent_id);
      expect(responseBody[0].parent_title).toEqual(secondRootContent.parent_title);
      expect(responseBody[0].parent_slug).toEqual(secondRootContent.parent_slug);
      expect(responseBody[0].parent_username).toEqual(secondRootContent.parent_username);
      expect(responseBody[0].slug).toEqual(secondRootContent.slug);
      expect(responseBody[0].title).toEqual(secondRootContent.title);
      expect(responseBody[0].body).toEqual(secondRootContent.body);
      expect(responseBody[0].status).toEqual(secondRootContent.status);
      expect(responseBody[0].source_url).toEqual(secondRootContent.source_url);
      expect(Date.parse(responseBody[0].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].published_at)).not.toEqual(NaN);

      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(responseBody[1].owner_id).toEqual(defaultUser.id);
      expect(responseBody[1].username).toEqual(defaultUser.username);
      expect(responseBody[1].parent_id).toEqual(firstRootContent.parent_id);
      expect(responseBody[1].parent_title).toEqual(firstRootContent.parent_title);
      expect(responseBody[1].parent_slug).toEqual(firstRootContent.parent_slug);
      expect(responseBody[1].parent_username).toEqual(firstRootContent.parent_username);
      expect(responseBody[1].slug).toEqual(firstRootContent.slug);
      expect(responseBody[1].title).toEqual(firstRootContent.title);
      expect(responseBody[1].body).toEqual(firstRootContent.body);
      expect(responseBody[1].status).toEqual(firstRootContent.status);
      expect(responseBody[1].source_url).toEqual(firstRootContent.source_url);
      expect(Date.parse(responseBody[1].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].published_at)).not.toEqual(NaN);

      expect(responseBody[0].published_at > responseBody[1].published_at).toEqual(true);
    });

    test.only('With 60 entries and default "page" and "per_page"', async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();

      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 60;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });
      }

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.length).toEqual(30);
      expect(responseBody[0].title).toEqual('Conteúdo #60');
      expect(responseBody[29].title).toEqual('Conteúdo #31');
    });

    test('With 9 entries and custom "page" and "per_page"', async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();

      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 9;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });
      }

      const page1 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=1&per_page=3`);
      const page1Body = await page1.json();

      expect(page1.status).toEqual(200);
      expect(page1Body.length).toEqual(3);
      expect(page1Body[0].title).toEqual('Conteúdo #9');
      expect(page1Body[1].title).toEqual('Conteúdo #8');
      expect(page1Body[2].title).toEqual('Conteúdo #7');

      const page2 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=2&per_page=3`);
      const page2Body = await page2.json();

      expect(page2.status).toEqual(200);
      expect(page2Body.length).toEqual(3);
      expect(page2Body[0].title).toEqual('Conteúdo #6');
      expect(page2Body[1].title).toEqual('Conteúdo #5');
      expect(page2Body[2].title).toEqual('Conteúdo #4');

      const page3 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=3&per_page=3`);
      const page3Body = await page3.json();

      expect(page3.status).toEqual(200);
      expect(page3Body.length).toEqual(3);
      expect(page3Body[0].title).toEqual('Conteúdo #3');
      expect(page3Body[1].title).toEqual('Conteúdo #2');
      expect(page3Body[2].title).toEqual('Conteúdo #1');
    });

    test('With 9 entries but "page" out of bounds', async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();

      const defaultUser = await orchestrator.createUser();

      const numberOfContents = 9;

      for (let item = 0; item < numberOfContents; item++) {
        await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: `Conteúdo #${item + 1}`,
          status: 'published',
        });
      }

      const page4 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=4&per_page=3`);
      const page4Body = await page4.json();

      expect(page4.status).toEqual(200);
      expect(page4Body.length).toEqual(0);
    });

    test('With "page" with a String', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=CINCO`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve ser do tipo Number.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.base',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with an invalid minimum Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=0`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve possuir um valor mínimo de 1.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.min',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with an invalid maximum Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=9007199254740991`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve possuir um valor máximo de 9007199254740990.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.max',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with an unsafe Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=9007199254740992`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve possuir um valor máximo de 9007199254740990.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.unsafe',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "page" with a Float Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?page=1.5`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"page" deve ser um Inteiro.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'page',
        type: 'number.integer',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with a String', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?per_page=SEIS`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve ser do tipo Number.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.base',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with an invalid minimum Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?per_page=0`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve possuir um valor mínimo de 1.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.min',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with an invalid maximum Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?per_page=9007199254740991`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve possuir um valor máximo de 100.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.max',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with an unsafe Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?per_page=9007199254740992`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve possuir um valor máximo de 100.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.unsafe',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('With "per_page" with a Float Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents?per_page=1.5`);
      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"per_page" deve ser um Inteiro.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_unique_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'per_page',
        type: 'number.integer',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });
});
