import { version as uuidVersion } from 'uuid';

import emailConfirmation from 'models/email-confirmation.js';
import password from 'models/password.js';
import user from 'models/user.js';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/users/[username]', () => {
  describe('Anonymous user', () => {
    test('Patching other user', async () => {
      const defaultUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          username: 'anonymousUserPatchingOtherUser',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "update:user".');
      expect.soft(responseBody.status_code).toBe(403);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('Default user', () => {
    test('Patching other user', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'regularUserPatchingOtherUser',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Você não possui permissão para atualizar outro usuário.');
      expect(responseBody.action).toBe('Verifique se você possui a feature "update:user:others".');
      expect.soft(responseBody.status_code).toBe(403);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('CONTROLLER:USERS:USERNAME:PATCH:USER_CANT_UPDATE_OTHER_USER');
    });

    test('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 - 1000 * 60 * 60 * 24 * 30), // 30 days and 1 second ago
      });

      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      vi.useRealTimers();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: 'A new description',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(401);
      expect.soft(responseBody.status_code).toBe(401);
      expect(responseBody.name).toBe('UnauthorizedError');
      expect(responseBody.message).toBe('Usuário não possui sessão ativa.');
      expect(responseBody.action).toBe('Verifique se este usuário está logado.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const parsedCookiesFromGet = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromGet.session_id.name).toBe('session_id');
      expect(parsedCookiesFromGet.session_id.value).toBe('invalid');
      expect(parsedCookiesFromGet.session_id.maxAge).toBe(-1);
      expect(parsedCookiesFromGet.session_id.path).toBe('/');
      expect(parsedCookiesFromGet.session_id.httpOnly).toBe(true);

      const sessionObject = await orchestrator.findSessionByToken(defaultUserSession.token);
      expect(sessionObject).toBeUndefined();
    });

    test('Patching itself with a valid and unique username', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'regularUserPatchingHisUsername',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: 'regularUserPatchingHisUsername',
        description: defaultUser.description,
        email: defaultUser.email,
        features: defaultUser.features,
        notifications: defaultUser.notifications,
        tabcoins: 0,
        tabcash: 0,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);

      const defaultUserInDatabase = await user.findOneById(responseBody.id);
      const passwordsMatch = await password.compare('password', defaultUserInDatabase.password);
      expect(passwordsMatch).toBe(true);
      expect(defaultUserInDatabase.email).toBe(defaultUser.email);
    });

    test('Patching itself with a valid and same username but with different case letters', async () => {
      let defaultUser = await orchestrator.createUser({
        username: 'regularUser',
      });
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'REGULARUser',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: 'REGULARUser',
        email: defaultUser.email,
        description: defaultUser.description,
        features: defaultUser.features,
        notifications: defaultUser.notifications,
        tabcoins: 0,
        tabcash: 0,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);

      const defaultUserInDatabase = await user.findOneById(responseBody.id);
      const passwordsMatch = await password.compare('password', defaultUserInDatabase.password);
      expect(passwordsMatch).toBe(true);
      expect(defaultUserInDatabase.email).toBe(defaultUser.email);
    });

    test('Patching itself with a valid, unique but "untrimmed" username', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: ' untrimmedUsername ',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: 'untrimmedUsername',
        description: defaultUser.description,
        email: defaultUser.email,
        features: defaultUser.features,
        notifications: defaultUser.notifications,
        tabcoins: 0,
        tabcash: 0,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);
    });

    test('Patching itself with "username" set to a null value', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: null,
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('username');
    });

    test('Patching itself with "username" with an empty string', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: '',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('username');
    });

    test('Patching itself with "username" that\'s not a String', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 12345678,
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('username');
    });

    test('Patching itself with "username" containing non alphanumeric characters', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: "<script>alert('XSS')</script>",
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('username');
    });

    test('Patching itself with "username" too short', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'ab',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve conter no mínimo 3 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('username');
    });

    test('Patching itself with "username" too long', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'userWith31Characterssssssssssss',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve conter no máximo 30 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('username');
    });

    test('Patching itself with "username" in blocked list', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'account',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('Este nome de usuário não está disponível para uso.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('username');
    });

    test('Patching itself with "body" totally blank', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('object');
    });

    test('Patching itself with "body" containing a String', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: "Please don't hack us, we are the good guys!",
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('object');
    });

    test('Patching itself with "body" containing a blank Object', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('Objeto enviado deve ter no mínimo uma chave.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('object');
    });

    test('Patching itself with another "email"', async () => {
      await orchestrator.deleteAllEmails();
      let defaultUser = await orchestrator.createUser({
        email: 'original@email.com',
      });
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          email: 'different@email.com',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: defaultUser.username,
        description: defaultUser.description,
        email: defaultUser.email,
        features: defaultUser.features,
        notifications: defaultUser.notifications,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: defaultUser.updated_at.toISOString(),
      });

      // Attention: it should not update the email in the database
      // before the user clicks on the confirmation link sent to the new email.
      // See `/tests/integration/email-confirmation` for more details.
      const userInDatabase = await user.findOneById(defaultUser.id);
      expect(userInDatabase.email).toBe('original@email.com');

      // RECEIVING CONFIRMATION EMAIL
      const confirmationEmail = await orchestrator.waitForFirstEmail();

      const tokenObjectInDatabase = await emailConfirmation.findOneTokenByUserId(defaultUser.id);
      const emailConfirmationPageEndpoint = emailConfirmation.getEmailConfirmationPageEndpoint(
        tokenObjectInDatabase.id,
      );

      expect(confirmationEmail.sender).toBe('<contato@tabnews.com.br>');
      expect(confirmationEmail.recipients).toStrictEqual(['<different@email.com>']);
      expect(confirmationEmail.subject).toBe('Confirme seu novo email');
      expect(confirmationEmail.text).toContain(defaultUser.username);
      expect(confirmationEmail.html).toContain(defaultUser.username);
      expect(confirmationEmail.text).toContain('Uma alteração de email foi solicitada.');
      expect(confirmationEmail.html).toContain('Uma alteração de email foi solicitada.');
      expect(confirmationEmail.text).toContain(emailConfirmationPageEndpoint);
      expect(confirmationEmail.html).toContain(emailConfirmationPageEndpoint);
    });

    test('Patching itself with the same "email"', async () => {
      await orchestrator.deleteAllEmails();
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const defaultUser = await usersRequestBuilder.buildUser();

      const { response, responseBody } = await usersRequestBuilder.patch(`/${defaultUser.username}`, {
        email: defaultUser.email,
      });

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: defaultUser.username,
        description: defaultUser.description,
        email: defaultUser.email,
        features: defaultUser.features,
        notifications: defaultUser.notifications,
        tabcoins: 0,
        tabcash: 0,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(await orchestrator.hasEmailsAfterDelay()).toBe(false);
    });

    test('Patching itself with "notifications"', async () => {
      const defaultUser = await orchestrator.createUser({
        notifications: true,
      });
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          notifications: false,
        }),
      });

      expect.soft(response.status).toBe(200);

      const userInDatabase = await user.findOneById(defaultUser.id);
      expect(userInDatabase.notifications).toBe(false);
    });

    test('Patching itself with a "description" containing a valid value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: 'my description',
        }),
      });

      const responseBody = await response.json();
      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: defaultUser.username,
        description: 'my description',
        email: defaultUser.email,
        features: [
          'create:session',
          'read:session',
          'create:content',
          'create:content:text_root',
          'create:content:text_child',
          'update:content',
          'update:user',
        ],
        notifications: defaultUser.notifications,
        tabcoins: 0,
        tabcash: 0,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });
    });

    test('Patching itself with a "description" containing more than 5.000 characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: 'a'.repeat(5001),
        }),
      });

      const responseBody = await response.json();
      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"description" deve conter no máximo 5000 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.type).toBe('string.max');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Patching itself with a "description" containing 100.000 invalid characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: '!' + '\u17b4'.repeat(100_000) + '\u17b4!',
        }),
      });

      const responseBody = await response.json();
      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"description" deve conter no máximo 5000 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.type).toBe('string.max');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Patching itself with a "description" containing value null', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: null,
        }),
      });

      const responseBody = await response.json();
      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"description" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.type).toBe('string.base');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Patching itself with the user having TabCoins and TabCash', async () => {
      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const defaultUser = await usersRequestBuilder.buildUser();

      await orchestrator.createBalance({
        balanceType: 'user:tabcoin',
        recipientId: defaultUser.id,
        amount: 200,
      });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 55,
      });

      const { response, responseBody } = await usersRequestBuilder.patch(`/${defaultUser.username}`, {
        description: 'new description',
      });

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: defaultUser.username,
        description: 'new description',
        email: defaultUser.email,
        features: defaultUser.features,
        notifications: defaultUser.notifications,
        tabcoins: 200,
        tabcash: 55,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });
    });

    test('Patching itself with "email", "username", "description" and "notifications"', async () => {
      await orchestrator.deleteAllEmails();

      const usersRequestBuilder = new RequestBuilder('/api/v1/users');
      const defaultUser = await usersRequestBuilder.buildUser();

      const { response, responseBody } = await usersRequestBuilder.patch(`/${defaultUser.username}`, {
        description: 'Updating all possible fields.',
        email: 'random_new_email@example.com',
        username: 'UpdatedUsername',
        notifications: false,
      });

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        id: defaultUser.id,
        username: 'UpdatedUsername',
        email: defaultUser.email,
        description: 'Updating all possible fields.',
        features: defaultUser.features,
        notifications: false,
        tabcoins: 0,
        tabcash: 0,
        created_at: defaultUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at).not.toBe(defaultUser.updated_at.toISOString());
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const foundUser = await user.findOneById(defaultUser.id);
      expect(foundUser.email).toBe(defaultUser.email);
      expect(foundUser.description).toBe('Updating all possible fields.');
      expect(foundUser.notifications).toBe(false);
      expect(foundUser.username).toBe('UpdatedUsername');
      expect(foundUser.updated_at.toISOString()).toBe(responseBody.updated_at);

      const confirmationEmail = await orchestrator.waitForFirstEmail();
      expect(confirmationEmail.recipients).toStrictEqual(['<random_new_email@example.com>']);
      expect(confirmationEmail.subject).toBe('Confirme seu novo email');
    });

    describe('With duplicated username and/or email', () => {
      test('Patching itself with "username" duplicated exactly (same uppercase letters)', async () => {
        await orchestrator.createUser({
          username: 'SameUPPERCASE',
        });
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${defaultUserSession.token}`,
          },

          body: JSON.stringify({
            username: 'SameUPPERCASE',
          }),
        });

        const responseBody = await response.json();

        expect.soft(response.status).toBe(400);
        expect.soft(responseBody.status_code).toBe(400);
        expect(responseBody.name).toBe('ValidationError');
        expect(responseBody.message).toBe('O "username" informado já está sendo usado.');
        expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
        expect(responseBody.error_location_code).toBe('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);
        expect(responseBody.key).toBe('username');
      });

      test('Patching itself with "username" duplicated (different uppercase letters)', async () => {
        await orchestrator.createUser({
          username: 'DIFFERENTuppercase',
        });
        let defaultUser = await orchestrator.createUser();
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${defaultUserSession.token}`,
          },

          body: JSON.stringify({
            username: 'differentUPPERCASE',
          }),
        });

        const responseBody = await response.json();

        expect.soft(response.status).toBe(400);
        expect.soft(responseBody.status_code).toBe(400);
        expect(responseBody.name).toBe('ValidationError');
        expect(responseBody.message).toBe('O "username" informado já está sendo usado.');
        expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
        expect(responseBody.error_location_code).toBe('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);
        expect(responseBody.key).toBe('username');
      });

      test('Patching itself with "email" duplicated exactly', async () => {
        await orchestrator.deleteAllEmails();
        await orchestrator.createUser({
          email: 'someone@example.com',
        });

        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await usersRequestBuilder.buildUser();

        const { response, responseBody } = await usersRequestBuilder.patch(`/${defaultUser.username}`, {
          email: 'someone@example.com',
        });

        expect.soft(response.status).toBe(200);
        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: defaultUser.username,
          email: defaultUser.email,
          description: defaultUser.description,
          features: defaultUser.features,
          notifications: defaultUser.notifications,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: defaultUser.updated_at.toISOString(),
        });

        const foundUser = await user.findOneById(defaultUser.id);
        expect(foundUser.email).toBe(defaultUser.email);
        expect(await orchestrator.hasEmailsAfterDelay()).toBe(false);
      });

      test('Patching itself with "email" duplicated exactly and other fields', async () => {
        await orchestrator.deleteAllEmails();
        await orchestrator.createUser({
          email: 'this_user_already_exists@example.com',
        });

        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await usersRequestBuilder.buildUser();

        const { response, responseBody } = await usersRequestBuilder.patch(`/${defaultUser.username}`, {
          description: 'New description',
          email: 'this_user_already_exists@example.com',
          notifications: false,
        });

        expect.soft(response.status).toBe(200);
        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: defaultUser.username,
          email: defaultUser.email,
          description: 'New description',
          features: defaultUser.features,
          notifications: false,
          tabcoins: 0,
          tabcash: 0,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: responseBody.updated_at,
        });

        expect(responseBody.updated_at).not.toBe(defaultUser.updated_at.toISOString());
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const foundUser = await user.findOneById(defaultUser.id);
        expect(foundUser.email).toBe(defaultUser.email);
        expect(foundUser.description).toBe('New description');
        expect(foundUser.notifications).toBe(false);
        expect(foundUser.updated_at.toISOString()).toBe(responseBody.updated_at);
        expect(await orchestrator.hasEmailsAfterDelay()).toBe(false);
      });

      test('Patching itself with duplicate "email" and "username" should only return "username" error', async () => {
        await orchestrator.createUser({ username: 'usernameStoredPreviously' });
        await orchestrator.createUser({ email: 'this_email_already_exists@example.com' });
        await orchestrator.createUser({ username: 'usernameStoredLater' });

        const usersRequestBuilder = new RequestBuilder('/api/v1/users/');
        const defaultUser = await usersRequestBuilder.buildUser();
        await orchestrator.deleteAllEmails();

        const { response, responseBody } = await usersRequestBuilder.patch(defaultUser.username, {
          email: 'this_email_already_exists@example.com',
          username: 'usernameStoredPreviously',
        });
        expect.soft(response.status).toBe(400);

        expect(responseBody).toStrictEqual({
          status_code: 400,
          name: 'ValidationError',
          message: 'O "username" informado já está sendo usado.',
          action: 'Ajuste os dados enviados e tente novamente.',
          error_location_code: 'MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS',
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
          key: 'username',
        });
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);

        const { response: response2, responseBody: responseBody2 } = await usersRequestBuilder.patch(
          defaultUser.username,
          {
            email: 'this_email_already_exists@example.com',
            username: 'usernameStoredLater',
          },
        );
        expect.soft(response2.status).toBe(400);

        expect(responseBody2).toStrictEqual({
          status_code: 400,
          name: 'ValidationError',
          message: 'O "username" informado já está sendo usado.',
          action: 'Ajuste os dados enviados e tente novamente.',
          error_location_code: 'MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS',
          error_id: responseBody2.error_id,
          request_id: responseBody2.request_id,
          key: 'username',
        });
        expect(uuidVersion(responseBody2.error_id)).toBe(4);
        expect(uuidVersion(responseBody2.request_id)).toBe(4);

        const foundUser = await user.findOneById(defaultUser.id);
        expect(foundUser.email).toBe(defaultUser.email);
        expect(foundUser.updated_at).toStrictEqual(defaultUser.updated_at);
        expect(await orchestrator.hasEmailsAfterDelay()).toBe(false);
      });

      test('Patching itself with a duplicate "username" for an inactive user with expired activation token', async () => {
        const inactiveUser = await orchestrator.createUser({ username: 'existentInactiveUser' });
        await orchestrator.updateActivateAccountTokenByUserId(inactiveUser.id, {
          expires_at: new Date(Date.now() - 1000),
        });

        const usersRequestBuilder = new RequestBuilder('/api/v1/users/');
        const defaultUser = await usersRequestBuilder.buildUser();

        const { response, responseBody } = await usersRequestBuilder.patch(defaultUser.username, {
          username: 'existentInactiveUser',
        });
        expect.soft(response.status).toBe(200);

        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: 'existentInactiveUser',
          email: defaultUser.email,
          description: defaultUser.description,
          features: defaultUser.features,
          notifications: true,
          tabcoins: 0,
          tabcash: 0,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: responseBody.updated_at,
        });

        expect(responseBody.updated_at).not.toBe(defaultUser.updated_at.toISOString());
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        await expect(user.findOneById(inactiveUser.id)).rejects.toThrow(
          `O id "${inactiveUser.id}" não foi encontrado no sistema.`,
        );
      });

      test('Patching itself with a duplicate "email" for an inactive user with expired activation token', async () => {
        await orchestrator.deleteAllEmails();
        const inactiveUser = await orchestrator.createUser({ email: 'existent.inactive.user@example.com' });
        await orchestrator.updateActivateAccountTokenByUserId(inactiveUser.id, {
          expires_at: new Date(Date.now() - 1000),
        });

        const usersRequestBuilder = new RequestBuilder('/api/v1/users/');
        const defaultUser = await usersRequestBuilder.buildUser();

        const { response, responseBody } = await usersRequestBuilder.patch(defaultUser.username, {
          email: 'existent.inactive.user@example.com',
        });
        expect.soft(response.status).toBe(200);

        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: defaultUser.username,
          email: defaultUser.email,
          description: defaultUser.description,
          features: defaultUser.features,
          notifications: true,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: responseBody.updated_at,
        });
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        await expect(user.findOneById(inactiveUser.id)).rejects.toThrow(
          `O id "${inactiveUser.id}" não foi encontrado no sistema.`,
        );

        const confirmationEmail = await orchestrator.waitForFirstEmail();

        expect(confirmationEmail.recipients).toStrictEqual(['<existent.inactive.user@example.com>']);
        expect(confirmationEmail.subject).toBe('Confirme seu novo email');
      });

      test('Patching itself with "username" and "email" duplicated from different users, both inactive with expired tokens', async () => {
        await orchestrator.deleteAllEmails();
        const firstInactiveUser = await orchestrator.createUser({ username: 'firstInactiveUser' });
        const secondInactiveUser = await orchestrator.createUser({ email: 'second.inactive.user@example.com' });
        await orchestrator.updateActivateAccountTokenByUserId(firstInactiveUser.id, {
          expires_at: new Date(Date.now() - 1000),
        });
        await orchestrator.updateActivateAccountTokenByUserId(secondInactiveUser.id, {
          expires_at: new Date(Date.now() - 1000),
        });

        const usersRequestBuilder = new RequestBuilder('/api/v1/users/');
        const defaultUser = await usersRequestBuilder.buildUser();

        const { response, responseBody } = await usersRequestBuilder.patch(defaultUser.username, {
          username: 'firstInactiveUser',
          email: 'second.inactive.user@example.com',
        });
        expect.soft(response.status).toBe(200);

        expect(responseBody).toStrictEqual({
          id: defaultUser.id,
          username: 'firstInactiveUser',
          email: defaultUser.email,
          description: defaultUser.description,
          features: defaultUser.features,
          notifications: true,
          tabcoins: 0,
          tabcash: 0,
          created_at: defaultUser.created_at.toISOString(),
          updated_at: responseBody.updated_at,
        });

        expect(responseBody.updated_at).not.toBe(defaultUser.updated_at.toISOString());
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const confirmationEmail = await orchestrator.waitForFirstEmail();

        expect(confirmationEmail.recipients).toStrictEqual(['<second.inactive.user@example.com>']);
        expect(confirmationEmail.subject).toBe('Confirme seu novo email');

        await expect(user.findOneById(firstInactiveUser.id)).rejects.toThrow(
          `O id "${firstInactiveUser.id}" não foi encontrado no sistema.`,
        );
        await expect(user.findOneById(secondInactiveUser.id)).rejects.toThrow(
          `O id "${secondInactiveUser.id}" não foi encontrado no sistema.`,
        );
      });
    });

    describe('TEMPORARY BEHAVIOR', () => {
      test('Patching itself with another "password"', async () => {
        let defaultUser = await orchestrator.createUser({
          password: 'thisPasswordWillNotChange',
        });
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${defaultUserSession.token}`,
          },

          body: JSON.stringify({
            password: 'CHANGE.MY.PASSWORD',
          }),
        });

        expect.soft(response.status).toBe(400);

        const defaultUserInDatabase = await user.findOneById(defaultUser.id);
        const passwordsMatch = await password.compare('thisPasswordWillNotChange', defaultUserInDatabase.password);
        const wrongPasswordMatch = await password.compare('CHANGE.MY.PASSWORD', defaultUserInDatabase.password);
        expect(passwordsMatch).toBe(true);
        expect(wrongPasswordMatch).toBe(false);
      });
    });
  });

  describe('User with "update:user:others" feature', () => {
    test('Patching other user only with fields that cannot be updated', async () => {
      let privilegedUser = await orchestrator.createUser();
      await orchestrator.addFeaturesToUser(privilegedUser, ['update:user:others']);
      privilegedUser = await orchestrator.activateUser(privilegedUser);
      const privilegedUserSession = await orchestrator.createSession(privilegedUser);

      let secondUser = await orchestrator.createUser();
      secondUser = await orchestrator.activateUser(secondUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'newUsername',
          email: 'new-email@example.com',
          notifications: false,
          password: 'new_password',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('Objeto enviado deve ter no mínimo uma chave.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.key).toBe('object');
    });

    test('Patching other user with all fields', async () => {
      let privilegedUser = await orchestrator.createUser();
      await orchestrator.addFeaturesToUser(privilegedUser, ['update:user:others']);
      privilegedUser = await orchestrator.activateUser(privilegedUser);
      const privilegedUserSession = await orchestrator.createSession(privilegedUser);

      let secondUser = await orchestrator.createUser({
        password: 'initialPassword',
      });
      secondUser = await orchestrator.activateUser(secondUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${privilegedUserSession.token}`,
        },

        body: JSON.stringify({
          description: 'New description.',
          username: 'newUsername',
          email: 'new-email@example.com',
          notifications: false,
          password: 'new_password',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        id: secondUser.id,
        username: secondUser.username,
        description: 'New description.',
        features: secondUser.features,
        tabcoins: 0,
        tabcash: 0,
        created_at: secondUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      const secondUserInDatabase = await user.findOneById(secondUser.id);
      expect(secondUserInDatabase.notifications).toBe(true);
      expect(secondUserInDatabase.email).toBe(secondUser.email);

      const passwordsMatch = await password.compare('initialPassword', secondUserInDatabase.password);
      const wrongPasswordMatch = await password.compare('new_password', secondUserInDatabase.password);
      expect(passwordsMatch).toBe(true);
      expect(wrongPasswordMatch).toBe(false);
    });
  });
});
