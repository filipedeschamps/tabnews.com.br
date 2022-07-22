const { join, resolve } = require('path');
import { readFileSync } from 'fs';
import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/contents/[username]/[slug]/thumbnail', () => {
  describe('Anonymous user', () => {
    test('"root" content with "draft" status', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/thumbnail`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'Este conteúdo não está disponível.',
        action:
          'Verifique se o "slug" está digitado corretamente ou considere o fato do conteúdo ter sido despublicado.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:THUMBNAIL:GET_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('"root" content with "deleted" status', async () => {
      const defaultUser = await orchestrator.createUser();
      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content',
        status: 'published',
      });

      await orchestrator.updateContent(rootContent.id, { status: 'deleted' });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/thumbnail`
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'Este conteúdo não está disponível.',
        action:
          'Verifique se o "slug" está digitado corretamente ou considere o fato do conteúdo ter sido despublicado.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:THUMBNAIL:GET_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
      });

      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('"root" content with short "title", short "username" and 0 "children"', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'abc',
      });

      jest.useFakeTimers({
        now: Date.parse('2022-01-01T12:00:00.000Z'),
        advanceTimers: true,
      });

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Short title',
        status: 'published',
      });

      jest.useRealTimers();

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/thumbnail`
      );

      const responseBody = await response.buffer();

      const benchmarkFile = readFileSync(
        join(
          resolve('.'),
          'tests',
          'integration',
          'api',
          'v1',
          'contents',
          '[username]',
          '[slug]',
          'thumbnail',
          'root-short-title-short-username-0-children.png'
        )
      );

      expect(response.status).toEqual(200);
      expect(Buffer.compare(benchmarkFile, responseBody)).toEqual(0); // has the same bytes
    });

    test('"root" content with long "title", long "username" and 0 "children"', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'ThisUsernameHas30Characterssss',
      });

      jest.useFakeTimers({
        now: Date.parse('2022-06-06T12:00:00.000Z'),
        advanceTimers: true,
      });

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title:
          'This is a very long title and it should have 125 characters in total. Its not the maximum accepted value, but it is very long',
        status: 'published',
      });

      jest.useRealTimers();

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/thumbnail`
      );

      const responseBody = await response.buffer();

      const benchmarkFile = readFileSync(
        join(
          resolve('.'),
          'tests',
          'integration',
          'api',
          'v1',
          'contents',
          '[username]',
          '[slug]',
          'thumbnail',
          'root-long-title-long-username-0-children.png'
        )
      );

      expect(response.status).toEqual(200);
      expect(Buffer.compare(benchmarkFile, responseBody)).toEqual(0); // has the same bytes
    });

    test('"root" content with long "title", long "username" and 2 "children"', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'ThisUsernameHas30Charactersss2',
      });

      jest.useFakeTimers({
        now: Date.parse('2022-07-01T12:00:00.000Z'),
        advanceTimers: true,
      });

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title:
          'This is a very long title and it should have 125 characters in total. Its not the maximum accepted value, but it is very long',
        status: 'published',
      });

      jest.useRealTimers();

      const childContent1 = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        body: 'Body',
        status: 'published',
      });

      await orchestrator.createContent({
        parent_id: childContent1.id,
        owner_id: defaultUser.id,
        body: 'Body',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}/thumbnail`
      );

      const responseBody = await response.buffer();

      const benchmarkFile = readFileSync(
        join(
          resolve('.'),
          'tests',
          'integration',
          'api',
          'v1',
          'contents',
          '[username]',
          '[slug]',
          'thumbnail',
          'root-long-title-long-username-2-children.png'
        )
      );

      expect(response.status).toEqual(200);
      expect(Buffer.compare(benchmarkFile, responseBody)).toEqual(0); // has the same bytes
    });

    test('"child" content with short "parent_title", short "body" and 0 "children"', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'ChildTest1',
      });

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Short title',
        status: 'published',
      });

      jest.useFakeTimers({
        now: Date.parse('2022-02-02T12:00:00.000Z'),
        advanceTimers: true,
      });

      const childContent = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        body: 'Short body',
        status: 'published',
      });

      jest.useRealTimers();

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}/thumbnail`
      );

      const responseBody = await response.buffer();

      const benchmarkFile = readFileSync(
        join(
          resolve('.'),
          'tests',
          'integration',
          'api',
          'v1',
          'contents',
          '[username]',
          '[slug]',
          'thumbnail',
          'child-short-parent-title-short-body-0-children.png'
        )
      );

      expect(response.status).toEqual(200);
      expect(Buffer.compare(benchmarkFile, responseBody)).toEqual(0); // has the same bytes
    });

    test('"child" content with long "parent_title", long "body" and 0 "children"', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'ChildTest2',
      });

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title:
          'This is a very long title and it should have 125 characters in total. Its not the maximum accepted value, but it is very long',
        status: 'published',
      });

      jest.useFakeTimers({
        now: Date.parse('2022-10-10T12:00:00.000Z'),
        advanceTimers: true,
      });

      const childContent = await orchestrator.createContent({
        parent_id: rootContent.id,
        owner_id: defaultUser.id,
        body: 'This is a very long body and it should have 125 characters in total. Its not the maximum accepted value, but it is very long.',
        status: 'published',
      });

      jest.useRealTimers();

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}/thumbnail`
      );

      const responseBody = await response.buffer();

      const benchmarkFile = readFileSync(
        join(
          resolve('.'),
          'tests',
          'integration',
          'api',
          'v1',
          'contents',
          '[username]',
          '[slug]',
          'thumbnail',
          'child-long-parent-title-long-body-0-children.png'
        )
      );

      expect(response.status).toEqual(200);
      expect(Buffer.compare(benchmarkFile, responseBody)).toEqual(0); // has the same bytes
    });

    test('"child" of a "child" content with "parent_title"', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'ChildTest3',
      });

      const contentLevel1 = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Content Level 1 Title',
        status: 'published',
      });

      jest.useFakeTimers({
        now: Date.parse('2022-02-02T12:00:00.000Z'),
        advanceTimers: true,
      });

      const contentLevel2 = await orchestrator.createContent({
        parent_id: contentLevel1.id,
        owner_id: defaultUser.id,
        title: 'Content Level 2 Title',
        status: 'published',
      });

      const contentLevel3 = await orchestrator.createContent({
        parent_id: contentLevel2.id,
        owner_id: defaultUser.id,
        body: 'Content Level 3 Body',
        status: 'published',
      });

      jest.useRealTimers();

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${contentLevel3.slug}/thumbnail`
      );

      const responseBody = await response.buffer();

      const benchmarkFile = readFileSync(
        join(
          resolve('.'),
          'tests',
          'integration',
          'api',
          'v1',
          'contents',
          '[username]',
          '[slug]',
          'thumbnail',
          'child-child-content-with-parent-title.png'
        )
      );

      expect(response.status).toEqual(200);
      expect(Buffer.compare(benchmarkFile, responseBody)).toEqual(0); // has the same bytes
    });

    test('"child" of a "child" content without "parent_title"', async () => {
      const defaultUser = await orchestrator.createUser({
        username: 'ChildTest4',
      });

      const contentLevel1 = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Content Level 1 Title',
        status: 'published',
      });

      jest.useFakeTimers({
        now: Date.parse('2022-02-02T12:00:00.000Z'),
        advanceTimers: true,
      });

      const contentLevel2 = await orchestrator.createContent({
        parent_id: contentLevel1.id,
        owner_id: defaultUser.id,
        body: 'No "title", just "body"',
        status: 'published',
      });

      const contentLevel3 = await orchestrator.createContent({
        parent_id: contentLevel2.id,
        owner_id: defaultUser.id,
        body: 'Content Level 3 Body',
        status: 'published',
      });

      jest.useRealTimers();

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${contentLevel3.slug}/thumbnail`
      );

      const responseBody = await response.buffer();

      const benchmarkFile = readFileSync(
        join(
          resolve('.'),
          'tests',
          'integration',
          'api',
          'v1',
          'contents',
          '[username]',
          '[slug]',
          'thumbnail',
          'child-child-content-without-parent-title.png'
        )
      );

      expect(response.status).toEqual(200);
      expect(Buffer.compare(benchmarkFile, responseBody)).toEqual(0); // has the same bytes
    });
  });
});
