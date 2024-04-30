import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';

import authentication from 'models/authentication';
import emailConfirmation from 'models/email-confirmation.js';
import password from 'models/password.js';
import user from 'models/user.js';
import orchestrator from 'tests/orchestrator.js';

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
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          username: 'anonymousUserPatchingOtherUser',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "update:user".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('Default user', () => {
    test('Patching other user', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      let secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'regularUserPatchingOtherUser',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para atualizar outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "update:user:others".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:USERS:USERNAME:PATCH:USER_CANT_UPDATE_OTHER_USER');
    });

    test('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      });

      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      vi.useRealTimers();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: 'A new description',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(401);
      expect(responseBody.status_code).toEqual(401);
      expect(responseBody.name).toEqual('UnauthorizedError');
      expect(responseBody.message).toEqual('Usuário não possui sessão ativa.');
      expect(responseBody.action).toEqual('Verifique se este usuário está logado.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);

      const parsedCookiesFromGet = authentication.parseSetCookies(response);
      expect(parsedCookiesFromGet.session_id.name).toEqual('session_id');
      expect(parsedCookiesFromGet.session_id.value).toEqual('invalid');
      expect(parsedCookiesFromGet.session_id.maxAge).toEqual(-1);
      expect(parsedCookiesFromGet.session_id.path).toEqual('/');
      expect(parsedCookiesFromGet.session_id.httpOnly).toEqual(true);

      const sessionObject = await orchestrator.findSessionByToken(defaultUserSession.token);
      expect(sessionObject).toBeUndefined();
    });

    test('Patching itself with a valid and unique username', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'regularUserPatchingHisUsername',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

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

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);

      const defaultUserInDatabase = await user.findOneById(responseBody.id);
      const passwordsMatch = await password.compare('password', defaultUserInDatabase.password);
      expect(passwordsMatch).toBe(true);
      expect(defaultUserInDatabase.email).toEqual(defaultUser.email);
    });

    test('Patching itself with a valid and same username but with different case letters', async () => {
      let defaultUser = await orchestrator.createUser({
        username: 'regularUser',
      });
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'REGULARUser',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

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

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);

      const defaultUserInDatabase = await user.findOneById(responseBody.id);
      const passwordsMatch = await password.compare('password', defaultUserInDatabase.password);
      expect(passwordsMatch).toBe(true);
      expect(defaultUserInDatabase.email).toEqual(defaultUser.email);
    });

    test('Patching itself with a valid, unique but "untrimmed" username', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: ' untrimmedUsername ',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

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

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);
    });

    test('Patching itself with "username" duplicated exactly (same uppercase letters)', async () => {
      await orchestrator.createUser({
        username: 'SameUPPERCASE',
      });
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'SameUPPERCASE',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('O "username" informado já está sendo usado.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Patching itself with "username" duplicated (different uppercase letters)', async () => {
      await orchestrator.createUser({
        username: 'DIFFERENTuppercase',
      });
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'differentUPPERCASE',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('O "username" informado já está sendo usado.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Patching itself with "username" set to a null value', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: null,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Patching itself with "username" with an empty string', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: '',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Patching itself with "username" that\'s not a String', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 12345678,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Patching itself with "username" containing non alphanumeric characters', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: "<script>alert('XSS')</script>",
        }),
      });

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

    test('Patching itself with "username" too short', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'ab',
        }),
      });

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

    test('Patching itself with "username" too long', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'userWith31Characterssssssssssss',
        }),
      });

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

    test('Patching itself with "username" in blocked list', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'account',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Este nome de usuário não está disponível para uso.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('username');
    });

    test('Patching itself with "body" totally blank', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('object');
    });

    test('Patching itself with "body" containing a String', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: "Please don't hack us, we are the good guys!",
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('object');
    });

    test('Patching itself with "body" containing a blank Object', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Objeto enviado deve ter no mínimo uma chave.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('object');
    });

    test('Patching itself with another "email"', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'original@email.com',
      });
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          email: 'different@email.com',
        }),
      });

      expect(response.status).toEqual(200);

      // Attention: it should not update the email in the database
      // before the user clicks on the confirmation link sent to the new email.
      // See `/tests/integration/email-confirmation` for more details.
      const userInDatabase = await user.findOneById(defaultUser.id);
      expect(userInDatabase.email).toEqual('original@email.com');

      // RECEIVING CONFIRMATION EMAIL
      const confirmationEmail = await orchestrator.getLastEmail();

      const tokenObjectInDatabase = await emailConfirmation.findOneTokenByUserId(defaultUser.id);
      const emailConfirmationPageEndpoint = emailConfirmation.getEmailConfirmationPageEndpoint(
        tokenObjectInDatabase.id,
      );

      expect(confirmationEmail.sender).toEqual('<contato@tabnews.com.br>');
      expect(confirmationEmail.recipients).toEqual(['<different@email.com>']);
      expect(confirmationEmail.subject).toEqual('Confirme seu novo email');
      expect(confirmationEmail.text).toContain(defaultUser.username);
      expect(confirmationEmail.html).toContain(defaultUser.username);
      expect(confirmationEmail.text).toContain('Uma alteração de email foi solicitada.');
      expect(confirmationEmail.html).toContain('Uma alteração de email foi solicitada.');
      expect(confirmationEmail.text).toContain(emailConfirmationPageEndpoint);
      expect(confirmationEmail.html).toContain(emailConfirmationPageEndpoint);
    });

    test('Patching itself with "notifications"', async () => {
      const defaultUser = await orchestrator.createUser({
        notifications: true,
      });
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          notifications: false,
        }),
      });

      expect(response.status).toEqual(200);

      const userInDatabase = await user.findOneById(defaultUser.id);
      expect(userInDatabase.notifications).toBe(false);
    });

    test('Patching itself with a "description" containing a valid value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: 'my description',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(200);
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
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: 'a'.repeat(5001),
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"description" deve conter no máximo 5000 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.type).toEqual('string.max');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Patching itself with a "description" containing value null', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          description: null,
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"description" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.type).toEqual('string.base');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    describe('TEMPORARY BEHAVIOR', () => {
      test('Patching itself with another "password"', async () => {
        let defaultUser = await orchestrator.createUser({
          password: 'thisPasswordWillNotChange',
        });
        defaultUser = await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'patch',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${defaultUserSession.token}`,
          },

          body: JSON.stringify({
            password: 'CHANGE.MY.PASSWORD',
          }),
        });

        expect(response.status).toEqual(400);

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
        method: 'patch',
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Objeto enviado deve ter no mínimo uma chave.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('object');
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
        method: 'patch',
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

      expect(response.status).toEqual(200);
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
