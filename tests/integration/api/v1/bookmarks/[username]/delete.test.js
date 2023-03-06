import fetch from 'cross-fetch';
import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('DELETE /api/v1/bookmarks/[username]', () => {
  beforeEach(async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  describe('Anonymous user', () => {
    test('With no session', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/bookmarks/${defaultUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:session".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('With authenticated use', () => {
    test('Without content_id', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado',
        status: 'published',
      });

      await orchestrator.addBookmarksToUser(defaultUser.id, [firstRootContent.id]);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/bookmarks/${defaultUser.username}`, {
        method: 'DELETE',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"content_id" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Someone else bookmarks', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);

      let secondUser = await orchestrator.createUser();
      secondUser = await orchestrator.activateUser(secondUser);
      const secondSessionObject = await orchestrator.createSession(secondUser);

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado',
        status: 'published',
      });

      await orchestrator.addBookmarksToUser(defaultUser.id, [firstRootContent.id]);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/bookmarks/${defaultUser.username}`, {
        method: 'DELETE',
        headers: {
          cookie: `session_id=${secondSessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: `${firstRootContent.id}`,
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para atualizar o conteúdo de outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "update:bookmarks:others".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual(
        'CONTROLLER:BOOKMARKS:PATCH:USER_CANT_UPDATE_BOOKMARKS_FROM_OTHER_USER'
      );
    });

    test('Own bookmarks', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado',
        status: 'published',
      });

      await orchestrator.addBookmarksToUser(defaultUser.id, [firstRootContent.id]);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/bookmarks/${defaultUser.username}`, {
        method: 'DELETE',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: `${firstRootContent.id}`,
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(200);
    });
  });
});
