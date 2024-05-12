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
      expect(responseBody.error_location_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
    });

    test('Content with "username" existent, but "slug" non-existent', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/esse-slug-nao-existe`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND');
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
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND');
    });

    test('Content "root" with "status" set to "published"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo publicamente disponível',
        body: 'Conteúdo relevante deveria estar disponível para todos.',
        status: 'published',
        source_url: 'https://www.tabnews.com.br/',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: defaultUserContent.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'conteudo-publicamente-disponivel',
        title: 'Conteúdo publicamente disponível',
        body: 'Conteúdo relevante deveria estar disponível para todos.',
        status: 'published',
        tabcoins: 1,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        source_url: 'https://www.tabnews.com.br/',
        created_at: defaultUserContent.created_at.toISOString(),
        updated_at: defaultUserContent.updated_at.toISOString(),
        published_at: defaultUserContent.published_at.toISOString(),
        deleted_at: null,
        owner_username: defaultUser.username,
        children_deep_count: 0,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidVersion(responseBody.owner_id)).toEqual(4);
    });

    test('Content "root" with "status" set to "deleted"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo existente, mas não publicamente disponível',
        body: 'Deveria estar disponível para ninguém.',
        status: 'published',
      });

      await orchestrator.updateContent(defaultUserContent.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Content "root" with with "children"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo root',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child nível 1',
        status: 'published',
      });

      const childContentLevel2 = await orchestrator.createContent({
        parent_id: childContentLevel1.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child nível 2',
        status: 'published',
      });

      const childContentLevel3 = await orchestrator.createContent({
        parent_id: childContentLevel2.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child nível 3',
        status: 'published',
      });

      const childContentLeve4 = await orchestrator.createContent({
        parent_id: childContentLevel3.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child nível 4 (vai ser deletado e não deve ser contabilizado)',
        status: 'published',
      });

      await orchestrator.updateContent(childContentLeve4.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: rootContent.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: responseBody.slug,
        title: 'Conteúdo root',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'published',
        tabcoins: 1,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        source_url: null,
        created_at: rootContent.created_at.toISOString(),
        updated_at: rootContent.updated_at.toISOString(),
        published_at: rootContent.published_at.toISOString(),
        deleted_at: null,
        owner_username: defaultUser.username,
        children_deep_count: 3,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidVersion(responseBody.owner_id)).toEqual(4);
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
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND');
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
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: childContent.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: responseBody.slug,
        title: null,
        body: 'Conteúdo child',
        status: 'published',
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        source_url: null,
        created_at: childContent.created_at.toISOString(),
        updated_at: childContent.updated_at.toISOString(),
        published_at: childContent.published_at.toISOString(),
        deleted_at: null,
        owner_username: defaultUser.username,
        children_deep_count: 0,
      });
    });

    test('Content "child" with "children"', async () => {
      const defaultUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: secondUser.id,
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

      const childContentLevel1 = await orchestrator.createContent({
        parent_id: childContent.id,
        owner_id: secondUser.id,
        body: 'Conteúdo child nível 1',
        status: 'published',
      });

      const childContentLevel2 = await orchestrator.createContent({
        parent_id: childContentLevel1.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child nível 2',
        status: 'published',
      });

      const childContentLeve3 = await orchestrator.createContent({
        parent_id: childContentLevel2.id,
        owner_id: defaultUser.id,
        body: 'Conteúdo child nível 3 (vai ser deletado e não deve ser contabilizado)',
        status: 'published',
      });

      await orchestrator.updateContent(childContentLeve3.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: childContent.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: responseBody.slug,
        title: null,
        body: 'Conteúdo child',
        status: 'published',
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        source_url: null,
        created_at: childContent.created_at.toISOString(),
        updated_at: childContent.updated_at.toISOString(),
        published_at: childContent.published_at.toISOString(),
        deleted_at: null,
        owner_username: defaultUser.username,
        children_deep_count: 2,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidVersion(responseBody.owner_id)).toEqual(4);
      expect(uuidVersion(responseBody.parent_id)).toEqual(4);
    });

    test('Content "child" with "status" set to "deleted"', async () => {
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

      await orchestrator.updateContent(childContent.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
      );
      const responseBody = await response.json();

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Content "root" with TabCoins credits and debits', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo com TabCoins',
        body: 'Conteúdo que foi avaliado positiva e negativamente.',
        status: 'published',
      });

      await orchestrator.createRate(defaultUserContent, 3);
      await orchestrator.createRate(defaultUserContent, -1);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: defaultUserContent.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'conteudo-com-tabcoins',
        title: 'Conteúdo com TabCoins',
        body: 'Conteúdo que foi avaliado positiva e negativamente.',
        status: 'published',
        tabcoins: 2,
        tabcoins_credit: 3,
        tabcoins_debit: -1,
        source_url: null,
        created_at: defaultUserContent.created_at.toISOString(),
        updated_at: defaultUserContent.updated_at.toISOString(),
        published_at: defaultUserContent.published_at.toISOString(),
        deleted_at: null,
        owner_username: defaultUser.username,
        children_deep_count: 0,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidVersion(responseBody.owner_id)).toEqual(4);
    });

    describe('Sponsored contents', () => {
      test('An active sponsored content', async () => {
        const firstUser = await orchestrator.createUser();
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: firstUser.id,
          amount: 100,
        });

        const createdSponsoredContent = await orchestrator.createSponsoredContent({
          owner_id: firstUser.id,
          title: 'Root content title',
          body: 'Body',
          tabcash: 100,
        });

        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${createdSponsoredContent.slug}`,
        );
        const responseBody = await response.json();

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          id: createdSponsoredContent.content_id,
          parent_id: null,
          owner_id: firstUser.id,
          slug: 'root-content-title',
          title: 'Root content title',
          body: 'Body',
          children_deep_count: 0,
          status: 'sponsored',
          source_url: null,
          published_at: createdSponsoredContent.published_at.toISOString(),
          created_at: createdSponsoredContent.created_at.toISOString(),
          updated_at: createdSponsoredContent.updated_at.toISOString(),
          deleted_at: null,
          owner_username: firstUser.username,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
        });
      });

      test('A deactivated sponsored content', async () => {
        vi.useFakeTimers({
          now: new Date('2024-05-11T00:00:00.000Z'),
        });

        const firstUser = await orchestrator.createUser();
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: firstUser.id,
          amount: 100,
        });

        const createdSponsoredContent = await orchestrator.createSponsoredContent({
          owner_id: firstUser.id,
          title: 'Root content title',
          body: 'Body',
          tabcash: 100,
          deactivate_at: new Date('2024-05-20T00:00:00.000Z'),
        });

        vi.useRealTimers();

        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${createdSponsoredContent.slug}`,
        );
        const responseBody = await response.json();

        expect(response.status).toEqual(404);
        expect(responseBody).toStrictEqual({
          status_code: 404,
          name: 'NotFoundError',
          message: 'O conteúdo informado não foi encontrado no sistema.',
          action: 'Verifique se o "slug" está digitado corretamente.',
          error_location_code: 'CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND',
          key: 'slug',
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
        });
      });

      test('Child of a sponsored content', async () => {
        const firstUser = await orchestrator.createUser();
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: firstUser.id,
          amount: 100,
        });

        const createdSponsoredContent = await orchestrator.createSponsoredContent({
          owner_id: firstUser.id,
          title: 'Root content title',
          body: 'Body',
          tabcash: 100,
        });

        const secondUser = await orchestrator.createUser();
        const childContent = await orchestrator.createContent({
          parent_id: createdSponsoredContent.content_id,
          owner_id: secondUser.id,
          title: 'Child',
          status: 'published',
        });

        const response = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContent.slug}`,
        );
        const responseBody = await response.json();

        expect(response.status).toEqual(200);

        expect(responseBody).toStrictEqual({
          id: childContent.id,
          parent_id: createdSponsoredContent.content_id,
          owner_id: secondUser.id,
          slug: 'child',
          title: 'Child',
          body: childContent.body,
          children_deep_count: 0,
          status: 'published',
          source_url: null,
          published_at: childContent.published_at.toISOString(),
          created_at: childContent.created_at.toISOString(),
          updated_at: childContent.updated_at.toISOString(),
          deleted_at: null,
          owner_username: secondUser.username,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
        });
      });
    });
  });
});
