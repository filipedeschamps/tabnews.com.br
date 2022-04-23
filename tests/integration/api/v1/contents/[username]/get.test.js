import fetch from 'cross-fetch';
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
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/ThisUserDoesNotExists`);
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
    });

    test('"username" existent, but with no content at all', async () => {
      const defaultUser = await orchestrator.createUser();
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('"username" existent, but with no "published" "root" content', async () => {
      const defaultUser = await orchestrator.createUser();

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

    test('"username" existent and with "published" "child" content', async () => {
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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('"username" existent with 4 contents, but only 2 "published" and "root"', async () => {
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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.length).toEqual(2);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(responseBody[0].owner_id).toEqual(defaultUser.id);
      expect(responseBody[0].username).toEqual(defaultUser.username);
      expect(responseBody[0].parent_id).toEqual(firstRootContent.parent_id);
      expect(responseBody[0].slug).toEqual(firstRootContent.slug);
      expect(responseBody[0].title).toEqual(firstRootContent.title);
      expect(responseBody[0].body).toEqual(firstRootContent.body);
      expect(responseBody[0].status).toEqual(firstRootContent.status);
      expect(responseBody[0].source_url).toEqual(firstRootContent.source_url);
      expect(Date.parse(responseBody[0].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].published_at)).not.toEqual(NaN);

      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(responseBody[1].owner_id).toEqual(defaultUser.id);
      expect(responseBody[1].username).toEqual(defaultUser.username);
      expect(responseBody[1].parent_id).toEqual(secondRootContent.parent_id);
      expect(responseBody[1].slug).toEqual(secondRootContent.slug);
      expect(responseBody[1].title).toEqual(secondRootContent.title);
      expect(responseBody[1].body).toEqual(secondRootContent.body);
      expect(responseBody[1].status).toEqual(secondRootContent.status);
      expect(responseBody[1].source_url).toEqual(secondRootContent.source_url);
      expect(Date.parse(responseBody[1].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].published_at)).not.toEqual(NaN);

      expect(responseBody[1].published_at > responseBody[0].published_at).toEqual(true);
    });
  });
});
