import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents/[username]/[slug]/children', () => {
  describe('Anonymous user', () => {
    test('From "root" content with "draft" status', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/children`,
      );
      const responseBody = await response.json();

      expect.soft(response.status).toBe(404);
      expect.soft(responseBody.status_code).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
      expect(responseBody.message).toBe('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toBe('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('CONTROLLER:CONTENT:CHILDREN:GET_HANDLER:SLUG_NOT_FOUND');
    });

    test('From "root" content with "deleted" status', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      await orchestrator.updateContent(rootContent.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/children`,
      );
      const responseBody = await response.json();

      expect.soft(response.status).toBe(404);
      expect.soft(responseBody.status_code).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
      expect(responseBody.message).toBe('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toBe('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('CONTROLLER:CONTENT:CHILDREN:GET_HANDLER:SLUG_NOT_FOUND');
    });

    test('From "root" content with "published" status with no children', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/children`,
      );
      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual([]);
    });

    test('From "root" content, ignore deleted child without children', async () => {
      const defaultUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      const childContentDeleted = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        title: 'Child content [Deleted]',
        status: 'published',
      });
      await orchestrator.updateContent(childContentDeleted.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/children`,
      );
      expect.soft(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toStrictEqual([]);
    });

    test('From "root" content, include child of deleted child', async () => {
      const defaultUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      const childContentLevel1Deleted = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 1] [Deleted]',
        status: 'published',
      });

      const childContentLevel2 = await orchestrator.createContent({
        parent_id: childContentLevel1Deleted.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 2] [Published]',
        status: 'published',
      });

      await orchestrator.updateContent(childContentLevel1Deleted.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/children`,
      );
      expect.soft(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toStrictEqual([
        {
          id: childContentLevel1Deleted.id,
          parent_id: rootContent.id,
          children_deep_count: 1,
          type: 'content',
          children: [
            {
              id: childContentLevel2.id,
              owner_id: defaultUser.id,
              parent_id: childContentLevel1Deleted.id,
              slug: childContentLevel2.slug,
              title: childContentLevel2.title,
              body: childContentLevel2.body,
              tabcoins: 0,
              tabcoins_credit: 0,
              tabcoins_debit: 0,
              status: childContentLevel2.status,
              type: 'content',
              source_url: childContentLevel2.source_url,
              created_at: childContentLevel2.created_at.toISOString(),
              updated_at: childContentLevel2.updated_at.toISOString(),
              published_at: childContentLevel2.published_at.toISOString(),
              deleted_at: null,
              owner_username: defaultUser.username,
              children: [],
              children_deep_count: 0,
            },
          ],
        },
      ]);
    });

    test('From "root" content with "published" status with 6 "published" and 1 "draft" children', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootBranchLevel0 = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'root',
        status: 'published',
      });

      const childBranchALevel1 = await orchestrator.createContent({
        parent_id: rootBranchLevel0.id,
        owner_id: secondUser.id,
        title: 'Child branch A [Level 1]',
        status: 'published',
      });

      const childBranchALevel2 = await orchestrator.createContent({
        parent_id: childBranchALevel1.id,
        owner_id: firstUser.id,
        title: 'Child branch A [Level 2]',
        status: 'published',
      });

      const childBranchALevel3 = await orchestrator.createContent({
        parent_id: childBranchALevel2.id,
        owner_id: secondUser.id,
        title: 'Child branch A [Level 3]',
        status: 'published',
      });

      const childBranchBLevel1 = await orchestrator.createContent({
        parent_id: rootBranchLevel0.id,
        owner_id: secondUser.id,
        title: 'Child branch B [Level 1]',
        status: 'published',
      });

      const childBranchBLevel2Content1 = await orchestrator.createContent({
        parent_id: childBranchBLevel1.id,
        owner_id: firstUser.id,
        title: 'Child branch B [Level 2] #1',
        status: 'published',
      });

      const childBranchBLevel2Content2 = await orchestrator.createContent({
        parent_id: childBranchBLevel1.id,
        owner_id: secondUser.id,
        title: 'Child branch B [Level 2] #2',
        status: 'published',
      });

      // childBranchBLevel2Content3
      await orchestrator.createContent({
        parent_id: childBranchBLevel1.id,
        owner_id: firstUser.id,
        title: 'Child branch B [Level 2] #3 [Draft]',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${rootBranchLevel0.slug}/children`,
      );
      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect(responseBody.length).toBe(2);
      expect(responseBody).toStrictEqual([
        {
          id: childBranchBLevel1.id,
          owner_id: secondUser.id,
          parent_id: rootBranchLevel0.id,
          slug: childBranchBLevel1.slug,
          title: childBranchBLevel1.title,
          body: childBranchBLevel1.body,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          status: childBranchBLevel1.status,
          type: 'content',
          source_url: childBranchBLevel1.source_url,
          created_at: childBranchBLevel1.created_at.toISOString(),
          updated_at: childBranchBLevel1.updated_at.toISOString(),
          published_at: childBranchBLevel1.published_at.toISOString(),
          deleted_at: null,
          owner_username: secondUser.username,
          children: [
            {
              id: childBranchBLevel2Content1.id,
              owner_id: firstUser.id,
              parent_id: childBranchBLevel1.id,
              slug: childBranchBLevel2Content1.slug,
              title: childBranchBLevel2Content1.title,
              body: childBranchBLevel2Content1.body,
              tabcoins: 1,
              tabcoins_credit: 0,
              tabcoins_debit: 0,
              status: childBranchBLevel2Content1.status,
              type: 'content',
              source_url: childBranchBLevel2Content1.source_url,
              created_at: childBranchBLevel2Content1.created_at.toISOString(),
              updated_at: childBranchBLevel2Content1.updated_at.toISOString(),
              published_at: childBranchBLevel2Content1.published_at.toISOString(),
              deleted_at: null,
              owner_username: firstUser.username,
              children: [],
              children_deep_count: 0,
            },
            {
              id: childBranchBLevel2Content2.id,
              owner_id: secondUser.id,
              parent_id: childBranchBLevel1.id,
              slug: childBranchBLevel2Content2.slug,
              title: childBranchBLevel2Content2.title,
              body: childBranchBLevel2Content2.body,
              tabcoins: 0,
              tabcoins_credit: 0,
              tabcoins_debit: 0,
              status: childBranchBLevel2Content2.status,
              type: 'content',
              source_url: childBranchBLevel2Content2.source_url,
              created_at: childBranchBLevel2Content2.created_at.toISOString(),
              updated_at: childBranchBLevel2Content2.updated_at.toISOString(),
              published_at: childBranchBLevel2Content2.published_at.toISOString(),
              deleted_at: null,
              owner_username: secondUser.username,
              children: [],
              children_deep_count: 0,
            },
          ],
          children_deep_count: 2,
        },
        {
          id: childBranchALevel1.id,
          owner_id: secondUser.id,
          parent_id: rootBranchLevel0.id,
          slug: childBranchALevel1.slug,
          title: childBranchALevel1.title,
          body: childBranchALevel1.body,
          status: childBranchALevel1.status,
          type: 'content',
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          source_url: childBranchALevel1.source_url,
          created_at: childBranchALevel1.created_at.toISOString(),
          updated_at: childBranchALevel1.updated_at.toISOString(),
          published_at: childBranchALevel1.published_at.toISOString(),
          deleted_at: null,
          owner_username: secondUser.username,
          children: [
            {
              id: childBranchALevel2.id,
              owner_id: firstUser.id,
              parent_id: childBranchALevel1.id,
              slug: childBranchALevel2.slug,
              title: childBranchALevel2.title,
              body: childBranchALevel2.body,
              status: childBranchALevel2.status,
              type: 'content',
              tabcoins: 1,
              tabcoins_credit: 0,
              tabcoins_debit: 0,
              source_url: childBranchALevel2.source_url,
              created_at: childBranchALevel2.created_at.toISOString(),
              updated_at: childBranchALevel2.updated_at.toISOString(),
              published_at: childBranchALevel2.published_at.toISOString(),
              deleted_at: null,
              owner_username: firstUser.username,
              children: [
                {
                  id: childBranchALevel3.id,
                  owner_id: secondUser.id,
                  parent_id: childBranchALevel2.id,
                  slug: childBranchALevel3.slug,
                  title: childBranchALevel3.title,
                  body: childBranchALevel3.body,
                  tabcoins: 1,
                  tabcoins_credit: 0,
                  tabcoins_debit: 0,
                  status: childBranchALevel3.status,
                  type: 'content',
                  source_url: childBranchALevel3.source_url,
                  created_at: childBranchALevel3.created_at.toISOString(),
                  updated_at: childBranchALevel3.updated_at.toISOString(),
                  published_at: childBranchALevel3.published_at.toISOString(),
                  deleted_at: null,
                  owner_username: secondUser.username,
                  children: [],
                  children_deep_count: 0,
                },
              ],
              children_deep_count: 1,
            },
          ],
          children_deep_count: 2,
        },
      ]);
    });

    test('From "child" content with "published" status with 2 "published" and 1 "draft" children', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootBranchLevel0 = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'root',
        status: 'published',
      });

      const childBranchALevel1 = await orchestrator.createContent({
        parent_id: rootBranchLevel0.id,
        owner_id: firstUser.id,
        title: 'Child branch A [Level 1]',
        status: 'published',
      });

      const childBranchALevel2 = await orchestrator.createContent({
        parent_id: childBranchALevel1.id,
        owner_id: firstUser.id,
        title: 'Child branch A [Level 2]',
        status: 'published',
      });

      // childBranchALevel3
      await orchestrator.createContent({
        parent_id: childBranchALevel2.id,
        owner_id: firstUser.id,
        title: 'Child branch A [Level 3]',
        status: 'published',
      });

      const childBranchBLevel1 = await orchestrator.createContent({
        parent_id: rootBranchLevel0.id,
        owner_id: firstUser.id,
        title: 'Child branch B [Level 1]',
        status: 'published',
      });

      const childBranchBLevel2Content1 = await orchestrator.createContent({
        parent_id: childBranchBLevel1.id,
        owner_id: firstUser.id,
        title: 'Child branch B [Level 2] #1',
        status: 'published',
      });

      const childBranchBLevel2Content2 = await orchestrator.createContent({
        parent_id: childBranchBLevel1.id,
        owner_id: secondUser.id,
        title: 'Child branch B [Level 2] #2',
        status: 'published',
      });

      // childBranchBLevel2Content3
      await orchestrator.createContent({
        parent_id: childBranchBLevel1.id,
        owner_id: firstUser.id,
        title: 'Child branch B [Level 2] #3 [Draft]',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${childBranchBLevel1.slug}/children`,
      );
      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect(responseBody.length).toBe(2);
      expect(responseBody).toStrictEqual([
        {
          id: childBranchBLevel2Content2.id,
          owner_id: secondUser.id,
          parent_id: childBranchBLevel1.id,
          slug: childBranchBLevel2Content2.slug,
          title: childBranchBLevel2Content2.title,
          body: childBranchBLevel2Content2.body,
          status: childBranchBLevel2Content2.status,
          type: 'content',
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          source_url: childBranchBLevel2Content2.source_url,
          created_at: childBranchBLevel2Content2.created_at.toISOString(),
          updated_at: childBranchBLevel2Content2.updated_at.toISOString(),
          published_at: childBranchBLevel2Content2.published_at.toISOString(),
          deleted_at: null,
          owner_username: secondUser.username,
          children: [],
          children_deep_count: 0,
        },
        {
          id: childBranchBLevel2Content1.id,
          owner_id: firstUser.id,
          parent_id: childBranchBLevel1.id,
          slug: childBranchBLevel2Content1.slug,
          title: childBranchBLevel2Content1.title,
          body: childBranchBLevel2Content1.body,
          status: childBranchBLevel2Content1.status,
          type: 'content',
          tabcoins: 0,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          source_url: childBranchBLevel2Content1.source_url,
          created_at: childBranchBLevel2Content1.created_at.toISOString(),
          updated_at: childBranchBLevel2Content1.updated_at.toISOString(),
          published_at: childBranchBLevel2Content1.published_at.toISOString(),
          deleted_at: null,
          owner_username: firstUser.username,
          children: [],
          children_deep_count: 0,
        },
      ]);
    });

    test('From published "child", ignore deleted child without children', async () => {
      const defaultUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 1]',
        status: 'published',
      });

      const childContentLevel2Deleted = await orchestrator.createContent({
        parent_id: childContentLevel1.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 2] [Deleted]',
        status: 'published',
      });
      await orchestrator.updateContent(childContentLevel2Deleted.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContentLevel1.slug}/children`,
      );
      expect.soft(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toStrictEqual([]);
    });

    test('From published "child", include child of deleted child', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      const childContentLevel1 = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 1]',
        status: 'published',
      });

      const childContentLevel2Deleted = await orchestrator.createContent({
        parent_id: childContentLevel1.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 2] [Deleted]',
        status: 'published',
      });

      const childContentLevel3 = await orchestrator.createContent({
        parent_id: childContentLevel2Deleted.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 3]',
        status: 'published',
      });

      await orchestrator.updateContent(childContentLevel2Deleted.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContentLevel1.slug}/children`,
      );
      expect.soft(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toStrictEqual([
        {
          id: childContentLevel2Deleted.id,
          parent_id: childContentLevel1.id,
          children_deep_count: 1,
          type: 'content',
          children: [
            {
              id: childContentLevel3.id,
              owner_id: defaultUser.id,
              parent_id: childContentLevel2Deleted.id,
              slug: childContentLevel3.slug,
              title: childContentLevel3.title,
              body: childContentLevel3.body,
              tabcoins: 0,
              tabcoins_credit: 0,
              tabcoins_debit: 0,
              status: 'published',
              type: 'content',
              source_url: childContentLevel3.source_url,
              created_at: childContentLevel3.created_at.toISOString(),
              updated_at: childContentLevel3.updated_at.toISOString(),
              published_at: childContentLevel3.published_at.toISOString(),
              deleted_at: null,
              owner_username: defaultUser.username,
              children: [],
              children_deep_count: 0,
            },
          ],
        },
      ]);
    });

    test('From deleted "child", return "not found"', async () => {
      const defaultUser = await orchestrator.createUser();

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      const childContentLevel1Deleted = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 1] [Deleted]',
        status: 'published',
      });

      // childContentLevel2
      await orchestrator.createContent({
        parent_id: childContentLevel1Deleted.id,
        owner_id: defaultUser.id,
        title: 'Child content [Level 2]',
        status: 'published',
      });

      await orchestrator.updateContent(childContentLevel1Deleted.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContentLevel1Deleted.slug}/children`,
      );
      expect.soft(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        key: 'slug',
        error_id: expect.any(String),
        request_id: expect.any(String),
        error_location_code: 'CONTROLLER:CONTENT:CHILDREN:GET_HANDLER:SLUG_NOT_FOUND',
      });
    });

    test('Tree with TabCoins credits and debits', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      const rootBranchLevel0 = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'root',
        status: 'published',
      });

      const childBranchALevel1 = await orchestrator.createContent({
        parent_id: rootBranchLevel0.id,
        owner_id: secondUser.id,
        title: 'Child branch A [Level 1]',
        status: 'published',
      });

      const childBranchALevel2 = await orchestrator.createContent({
        parent_id: childBranchALevel1.id,
        owner_id: firstUser.id,
        title: 'Child branch A [Level 2]',
        status: 'published',
      });

      const childBranchBLevel1 = await orchestrator.createContent({
        parent_id: rootBranchLevel0.id,
        owner_id: secondUser.id,
        title: 'Child branch B [Level 1]',
        status: 'published',
      });

      await orchestrator.createRate(childBranchALevel2, 4);

      await orchestrator.createRate(childBranchBLevel1, 2);
      await orchestrator.createRate(childBranchBLevel1, -1);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${rootBranchLevel0.slug}/children`,
      );
      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect(responseBody.length).toBe(2);
      expect(responseBody).toStrictEqual([
        {
          id: childBranchBLevel1.id,
          owner_id: secondUser.id,
          parent_id: rootBranchLevel0.id,
          slug: childBranchBLevel1.slug,
          title: childBranchBLevel1.title,
          body: childBranchBLevel1.body,
          tabcoins: 2,
          tabcoins_credit: 2,
          tabcoins_debit: -1,
          status: childBranchBLevel1.status,
          type: 'content',
          source_url: childBranchBLevel1.source_url,
          created_at: childBranchBLevel1.created_at.toISOString(),
          updated_at: childBranchBLevel1.updated_at.toISOString(),
          published_at: childBranchBLevel1.published_at.toISOString(),
          deleted_at: null,
          owner_username: secondUser.username,
          children: [],
          children_deep_count: 0,
        },
        {
          id: childBranchALevel1.id,
          owner_id: secondUser.id,
          parent_id: rootBranchLevel0.id,
          slug: childBranchALevel1.slug,
          title: childBranchALevel1.title,
          body: childBranchALevel1.body,
          status: childBranchALevel1.status,
          type: 'content',
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          source_url: childBranchALevel1.source_url,
          created_at: childBranchALevel1.created_at.toISOString(),
          updated_at: childBranchALevel1.updated_at.toISOString(),
          published_at: childBranchALevel1.published_at.toISOString(),
          deleted_at: null,
          owner_username: secondUser.username,
          children: [
            {
              id: childBranchALevel2.id,
              owner_id: firstUser.id,
              parent_id: childBranchALevel1.id,
              slug: childBranchALevel2.slug,
              title: childBranchALevel2.title,
              body: childBranchALevel2.body,
              status: childBranchALevel2.status,
              type: 'content',
              tabcoins: 5,
              tabcoins_credit: 4,
              tabcoins_debit: 0,
              source_url: childBranchALevel2.source_url,
              created_at: childBranchALevel2.created_at.toISOString(),
              updated_at: childBranchALevel2.updated_at.toISOString(),
              published_at: childBranchALevel2.published_at.toISOString(),
              deleted_at: null,
              owner_username: firstUser.username,
              children: [],
              children_deep_count: 0,
            },
          ],
          children_deep_count: 1,
        },
      ]);
    });
  });
});
