import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents/[username]/[slug]', () => {
  describe('Anonymous user', () => {
    test('Content with "username" non-existent', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/ThisUserDoesNotExists/slug`);
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

    test('Content with "username" existent, but "slug" non-existent', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/esse-slug-nao-existe`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND');
    });

    test('Content "root" with "status" set to "draft"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo existente, mas não publicamente disponível',
        body: 'Deveria estar disponível para ninguém.',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND');
    });

    test('Content "root" with "status" set to "published"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo publicamente disponível',
        body: 'Deveria estar disponível para todos.',
        status: 'published',
        source_url: 'https://www.tabnews.com.br/',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('conteudo-publicamente-disponivel');
      expect(responseBody.title).toEqual('Conteúdo publicamente disponível');
      expect(responseBody.body).toEqual('Deveria estar disponível para todos.');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual('https://www.tabnews.com.br/');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('Content "child" with "status" set to "draft"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo root',
        body: 'Conteúdo root',
        status: 'published',
      });

      const childContent = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND');
    });

    test('Content "child" with "status" set to "published"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo root',
        body: 'Conteúdo root',
        status: 'published',
      });

      const childContent = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(rootContent.id);
      expect(responseBody.parent_title).toEqual(rootContent.title);
      expect(responseBody.parent_slug).toEqual(rootContent.slug);
      expect(responseBody.parent_username).toEqual(rootContent.username);
      expect(responseBody.slug).toEqual(childContent.slug);
      expect(responseBody.title).toEqual(null);
      expect(responseBody.body).toEqual('Conteúdo child');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });
  });
});
