import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import content from 'models/content';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users/[username]/votes', () => {
  describe('Anonymous user', () => {
    test('Retrieving non-existing user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist/votes`);

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.error_location_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving too short user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/ab/votes`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no mínimo 3 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving too long user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userWith31Characterssssssssssss/votes`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no máximo 30 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving user with invalid characters', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/<script>alert("xss")/votes`);

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Retrieving existing user using same capital letters', async () => {
      await orchestrator.createUser({
        username: 'userNameToBeFound',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userNameToBeFound/votes`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual([]);
    });

    test('Retrieving existing user using different capital letters', async () => {
      await orchestrator.createUser({
        username: 'userNameToBeFoundCAPS',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/usernametobefoundcaps/votes`);

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual([]);
    });

    test('Retrieving user with content voted to debit', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 2,
      });

      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'debit',
          }),
        }
      );
      const VotedContent = await content.findUserVotes({
        username: secondUser.username,
        page: 1,
        per_page: 30,
      });

      expect(VotedContent.rows).toStrictEqual([
        {
          credit: '0',
          debit: '1',
          id: firstUserContent.id,
          parent_id: null,
          owner_id: firstUserContent.owner_id,
          slug: 'root',
          title: 'Root',
          status: 'published',
          source_url: null,
          created_at: firstUserContent.created_at,
          published_at: firstUserContent.published_at,
          updated_at: firstUserContent.updated_at,
          deleted_at: null,
          tabcoins: 0,
          owner_username: firstUserContent.owner_username,
          children_deep_count: '0',
        },
      ]);
    });

    test('Retrieving user with content voted to debit and deleted content', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 2,
      });

      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'debit',
          }),
        }
      );

      await orchestrator.updateContent(firstUserContent.id, {
        status: 'deleted',
      });

      const VotedContent = await content.findUserVotes({
        username: secondUser.username,
        page: 1,
        per_page: 30,
      });

      expect(VotedContent.rows).toStrictEqual([]);
    });

    test('Retrieving user with content voted to debit and 2 credit', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Root',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'published',
      });

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: secondUser.id,
        amount: 6,
      });

      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'debit',
          }),
        }
      );

      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'credit',
          }),
        }
      );

      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'credit',
          }),
        }
      );

      const VotedContent = await content.findUserVotes({
        username: secondUser.username,
        page: 1,
        per_page: 30,
      });

      expect(VotedContent.rows).toStrictEqual([
        {
          credit: '2',
          debit: '1',
          id: firstUserContent.id,
          parent_id: null,
          owner_id: firstUserContent.owner_id,
          slug: 'root',
          title: 'Root',
          status: 'published',
          source_url: null,
          created_at: firstUserContent.created_at,
          published_at: firstUserContent.published_at,
          updated_at: firstUserContent.updated_at,
          deleted_at: null,
          tabcoins: 2,
          owner_username: firstUserContent.owner_username,
          children_deep_count: '0',
        },
      ]);
    });
  });
});
