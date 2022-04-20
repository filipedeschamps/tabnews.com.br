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
    test('Retrieving blank root content list', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });

    test('Retrieving root content list with 2 entries (default strategy "descending")', async () => {
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

      const NotRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: firstRootContent.id,
        title: 'Este conteúdo não deverá aparecer na lista abaixo',
        body: `Quando um conteúdo possui um "parent_id",
               significa que ele é uma resposta a um outro conteúdo`,
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
      expect(responseBody[0].username).toEqual(defaultUser.username);
      expect(responseBody[1].parent_id).toEqual(firstRootContent.parent_id);
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
  });
});
