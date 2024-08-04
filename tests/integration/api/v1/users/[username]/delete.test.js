import { version as uuidVersion } from 'uuid';

import { relevantBody } from 'tests/constants-for-tests';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('DELETE /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('Deleting other user', async () => {
      const defaultUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          ban_type: 'nuke',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "ban:user".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('Default user', () => {
    test('Deleting other user', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);

      const secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          ban_type: 'nuke',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "ban:user".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('User with "ban:user" feature', () => {
    test('Without "ban_type" key', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);
      await orchestrator.addFeaturesToUser(firstUser, ['ban:user']);

      const secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"ban_type" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'ban_type',
        type: 'any.required',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With "ban_type" with an invalid value', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);
      await orchestrator.addFeaturesToUser(firstUser, ['ban:user']);

      const secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          ban_type: 'invalid-value',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"ban_type" deve possuir um dos seguintes valores: "nuke".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'ban_type',
        type: 'any.only',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With "ban_type" with "nuke" value', async () => {
      // 1) SETUP FIRST AND SECOND USERS
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);
      await orchestrator.addFeaturesToUser(firstUser, ['ban:user']);
      await orchestrator.createPrestige(firstUser.id);

      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      const secondUserSession = await orchestrator.createSession(secondUser);
      await orchestrator.createPrestige(secondUser.id);

      // 2) CREATE CONTENTS FOR FIRST USER
      const firstUserRootContent = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },
        body: JSON.stringify({
          title: 'firstUserRootContent',
          body: relevantBody,
          status: 'published',
        }),
      });

      const firstUserRootContentBody = await firstUserRootContent.json();

      const firstUserChildContent = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },
        body: JSON.stringify({
          parent_id: firstUserRootContentBody.id,
          body: 'firstUserChildContent' + relevantBody,
          status: 'published',
        }),
      });

      const firstUserChildContentBody = await firstUserChildContent.json();

      // 3) CREATE CONTENTS FOR SECOND USER
      const secondUserRootContent = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${secondUserSession.token}`,
        },
        body: JSON.stringify({
          title: 'secondUserRootContent',
          body: relevantBody,
          status: 'published',
        }),
      });

      const secondUserRootContentBody = await secondUserRootContent.json();

      const secondUserChildContent1 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${secondUserSession.token}`,
        },
        body: JSON.stringify({
          parent_id: firstUserRootContentBody.id,
          body: 'secondUserChildContent #1' + relevantBody,
          status: 'published',
        }),
      });

      const secondUserChildContent1Body = await secondUserChildContent1.json();

      const secondUserChildContent2 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${secondUserSession.token}`,
        },
        body: JSON.stringify({
          parent_id: firstUserRootContentBody.id,
          body: 'secondUserChildContent #2' + relevantBody,
          status: 'published',
        }),
      });

      const secondUserChildContent2Body = await secondUserChildContent2.json();

      await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${secondUserSession.token}`,
        },
        body: JSON.stringify({
          title: 'Draft Content',
          body: 'Draft Content' + relevantBody,
          status: 'draft',
        }),
      });

      const secondUserDeletedContentResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${secondUserSession.token}`,
        },
        body: JSON.stringify({
          title: 'Deleted Content',
          body: 'Deleted Content' + relevantBody,
          status: 'published',
        }),
      });

      const secondUserDeletedContentResponseBody = await secondUserDeletedContentResponse.json();

      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserDeletedContentResponseBody.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            status: 'deleted',
          }),
        },
      );

      // 4) MOVE TABCOINS FROM SECOND USER TO THE FIRST USER ROOT CONTENT (credit)
      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserRootContentBody.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'credit',
          }),
        },
      );

      // 5) MOVE TABCOINS FROM SECOND USER TO THE FIRST USER CHILD CONTENT (debit)
      await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserChildContentBody.slug}/tabcoins`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSession.token}`,
          },
          body: JSON.stringify({
            transaction_type: 'debit',
          }),
        },
      );

      // 6) CHECK FIRST USER (PRE-BAN)
      const firstUserCheck1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Results:
      //  +2 TabCoins from the root content
      //  +0 TabCoins from the child content replying to himself
      //  +1 TabCoin from the credit of the secondUser to the root content.
      //  -1 TabCoin from the debit of the secondUser to the child content.
      const firstUserCheck1Body = await firstUserCheck1.json();
      expect(firstUserCheck1Body.tabcoins).toBe(2);
      expect(firstUserCheck1Body.tabcash).toBe(0);
      expect(firstUserCheck1Body.features).toContain('ban:user');

      // 7) CHECK SECOND USER (PRE-BAN)
      const secondUserCheck1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Results:
      //  +2 TabCoins from the root content
      //  +2 TabCoins from the child content #1
      //  +2 TabCoins from the child content #2
      //  -2 TabCoins / +1 TabCash from credit to the firstUser root content
      //  -2 TabCoins / +1 TabCash from debit to the firstUser child content
      const secondUserCheck1Body = await secondUserCheck1.json();
      expect(secondUserCheck1Body.tabcoins).toBe(2);
      expect(secondUserCheck1Body.tabcash).toBe(2);

      // 8) CHECK FIRST USER ROOT CONTENT (PRE-BAN)
      const firstUserRootContentCheck1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserRootContentBody.slug}`,
      );
      const firstUserRootContentCheck1Body = await firstUserRootContentCheck1.json();

      expect(firstUserRootContentCheck1.status).toBe(200);
      expect(firstUserRootContentCheck1Body.status).toBe('published');
      expect(firstUserRootContentCheck1Body.tabcoins).toBe(2);
      expect(firstUserRootContentCheck1Body.children_deep_count).toBe(3);

      // 9) CHECK FIRST USER CHILD CONTENT (PRE-BAN)
      const firstUserChildCheck1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserChildContentBody.slug}`,
      );
      const firstUserChildCheck1Body = await firstUserChildCheck1.json();

      expect(firstUserChildCheck1.status).toBe(200);
      expect(firstUserRootContentCheck1Body.status).toBe('published');
      expect(firstUserChildCheck1Body.tabcoins).toBe(-1);
      expect(firstUserChildCheck1Body.children_deep_count).toBe(0);

      // 10) CHECK SECOND USER CONTENTS (PRE-BAN)
      const secondUserRootContentCheck1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserRootContentBody.slug}`,
      );
      const secondUserChildContent1Check1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserChildContent1Body.slug}`,
      );
      const secondUserChildContent2Check1 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserChildContent2Body.slug}`,
      );

      const secondUserRootContentCheck1Body = await secondUserRootContentCheck1.json();
      const secondUserChildContent1Check1Body = await secondUserChildContent1Check1.json();
      const secondUserChildContent2Check1Body = await secondUserChildContent2Check1.json();

      expect(secondUserRootContentCheck1.status).toBe(200);
      expect(secondUserRootContentCheck1Body.status).toBe('published');
      expect(secondUserChildContent1Check1.status).toBe(200);
      expect(secondUserChildContent1Check1Body.status).toBe('published');
      expect(secondUserChildContent2Check1.status).toBe(200);
      expect(secondUserChildContent2Check1Body.status).toBe('published');

      // 11) NUKE THE SECOND USER
      const nukeResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          ban_type: 'nuke',
        }),
      });

      const nukeResponseBody = await nukeResponse.json();

      expect(nukeResponse.status).toBe(200);

      expect(nukeResponseBody).toStrictEqual({
        id: secondUser.id,
        username: secondUser.username,
        description: secondUser.description,
        features: ['nuked'],
        created_at: secondUser.created_at.toISOString(),
        updated_at: nukeResponseBody.updated_at,
      });

      // 12) CHECK FIRST USER (POST-BAN)
      const firstUserCheck2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const firstUserCheck2Body = await firstUserCheck2.json();
      expect(firstUserCheck2Body.tabcoins).toBe(2);
      expect(firstUserCheck2Body.tabcash).toBe(0);

      // 13) CHECK SECOND USER (POST-BAN)
      const secondUserCheck2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondUserCheck2Body = await secondUserCheck2.json();

      expect(secondUserCheck2.status).toBe(404);
      expect(secondUserCheck2Body.status_code).toBe(404);
      expect(secondUserCheck2Body.name).toBe('NotFoundError');
      expect(secondUserCheck2Body.message).toBe('O "username" informado não foi encontrado no sistema.');
      expect(secondUserCheck2Body.action).toBe('Verifique se o "username" está digitado corretamente.');
      expect(secondUserCheck2Body.status_code).toBe(404);
      expect(secondUserCheck2Body.error_location_code).toBe('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(secondUserCheck2Body.error_id)).toBe(4);
      expect(uuidVersion(secondUserCheck2Body.request_id)).toBe(4);
      expect(secondUserCheck2Body.key).toBe('username');

      // 14) CHECK FIRST USER ROOT CONTENT (POST-BAN)
      const firstUserRootContentCheck2 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserRootContentBody.slug}`,
      );
      const firstUserRootContentCheck2Body = await firstUserRootContentCheck2.json();

      expect(firstUserRootContentCheck2.status).toBe(200);
      expect(firstUserRootContentCheck2Body.status).toBe('published');
      expect(firstUserRootContentCheck2Body.tabcoins).toBe(1);
      expect(firstUserRootContentCheck2Body.children_deep_count).toBe(1);

      // 15) CHECK FIRST USER CHILD CONTENT (POST-BAN)
      const firstUserChildCheck2 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserChildContentBody.slug}`,
      );
      const firstUserChildCheck2Body = await firstUserChildCheck2.json();

      expect(firstUserChildCheck2.status).toBe(200);
      expect(firstUserRootContentCheck2Body.status).toBe('published');
      expect(firstUserChildCheck2Body.tabcoins).toBe(0);
      expect(firstUserChildCheck2Body.children_deep_count).toBe(0);

      // 16) CHECK SECOND USER CONTENTS (POST-BAN)
      const secondUserRootContentCheck2 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserRootContentBody.slug}`,
      );
      const secondUserChildContent1Check2 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserChildContent1Body.slug}`,
      );
      const secondUserChildContent2Check2 = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserChildContent2Body.slug}`,
      );

      expect(secondUserRootContentCheck2.status).toBe(404);
      expect(secondUserChildContent1Check2.status).toBe(404);
      expect(secondUserChildContent2Check2.status).toBe(404);

      // 17) TRY TO CREATE NEW CONTENT AS THE SECOND USER
      const secondUserRootContent2 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${secondUserSession.token}`,
        },
        body: JSON.stringify({
          title: 'secondUserRootContent #2',
          body: 'Body',
          status: 'published',
        }),
      });

      const secondUserRootContent2Body = await secondUserRootContent2.json();

      expect(secondUserRootContent2.status).toBe(401);

      expect(secondUserRootContent2Body).toStrictEqual({
        name: 'UnauthorizedError',
        message: 'Usuário não possui sessão ativa.',
        action: 'Verifique se este usuário está logado.',
        status_code: 401,
        error_id: secondUserRootContent2Body.error_id,
        request_id: secondUserRootContent2Body.request_id,
      });
    });

    test('With "ban_type" on a non-existing user', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);
      await orchestrator.addFeaturesToUser(firstUser, ['ban:user']);

      const nukeResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          ban_type: 'nuke',
        }),
      });

      const nukeResponseBody = await nukeResponse.json();

      expect(nukeResponse.status).toBe(404);
      expect(nukeResponseBody.status_code).toBe(404);
      expect(nukeResponseBody.name).toBe('NotFoundError');
      expect(nukeResponseBody.message).toBe('O "username" informado não foi encontrado no sistema.');
      expect(nukeResponseBody.action).toBe('Verifique se o "username" está digitado corretamente.');
      expect(nukeResponseBody.status_code).toBe(404);
      expect(nukeResponseBody.error_location_code).toBe('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(nukeResponseBody.error_id)).toBe(4);
      expect(uuidVersion(nukeResponseBody.request_id)).toBe(4);
      expect(nukeResponseBody.key).toBe('username');
    });

    test('With "ban_type" on an user with "nuked" feature', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);
      await orchestrator.addFeaturesToUser(firstUser, ['ban:user']);

      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);
      await orchestrator.createSession(secondUser);

      const nuke1Response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          ban_type: 'nuke',
        }),
      });

      const nuke1ResponseBody = await nuke1Response.json();

      expect(nuke1Response.status).toBe(200);

      expect(nuke1ResponseBody).toStrictEqual({
        id: secondUser.id,
        username: secondUser.username,
        description: secondUser.description,
        features: ['nuked'],
        created_at: secondUser.created_at.toISOString(),
        updated_at: nuke1ResponseBody.updated_at,
      });

      const nuke2Response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          ban_type: 'nuke',
        }),
      });

      const nuke2ResponseBody = await nuke2Response.json();

      expect(nuke2Response.status).toBe(404);
      expect(nuke2ResponseBody.status_code).toBe(404);
      expect(nuke2ResponseBody.name).toBe('NotFoundError');
      expect(nuke2ResponseBody.message).toBe('O "username" informado não foi encontrado no sistema.');
      expect(nuke2ResponseBody.action).toBe('Verifique se o "username" está digitado corretamente.');
      expect(nuke2ResponseBody.status_code).toBe(404);
      expect(nuke2ResponseBody.error_location_code).toBe('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
      expect(uuidVersion(nuke2ResponseBody.error_id)).toBe(4);
      expect(uuidVersion(nuke2ResponseBody.request_id)).toBe(4);
      expect(nuke2ResponseBody.key).toBe('username');
    });
  });
});
