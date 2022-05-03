import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import user from 'models/user.js';
import password from 'models/password.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/users/[username]', () => {
  //TODO: test with expired session

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
      expect(responseBody.error_unique_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
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
      expect(responseBody.error_unique_code).toEqual('CONTROLLER:USERS:USERNAME:PATCH:USER_CANT_UPDATE_OTHER_USER');
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(defaultUser.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('regularUserPatchingHisUsername');
      expect(responseBody.features).toEqual(defaultUser.features);
      expect(responseBody.created_at).toEqual(defaultUser.created_at.toISOString());
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('email');

      const defaultUserInDatabase = await user.findOneById(responseBody.id);
      const passwordsMatch = await password.compare('password', defaultUserInDatabase.password);
      expect(passwordsMatch).toBe(true);

      const userInDatabase = await user.findOneById(responseBody.id);
      expect(userInDatabase.email).toEqual(defaultUser.email);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(defaultUser.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('untrimmedUsername');
      expect(responseBody.features).toEqual(defaultUser.features);
      expect(responseBody.created_at).toEqual(defaultUser.created_at.toISOString());
      expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('email');
    });

    test('Patching itself with "username" duplicated exactly (same uppercase letters)', async () => {
      let defaultUser = await orchestrator.createUser({
        username: 'SaMeUPPERCASE',
      });
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/SaMeUPPERCASE`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          username: 'SaMeUPPERCASE',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('O "username" informado já está sendo usado.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_unique_code).toEqual('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('Patching itself with "username" duplicated (different uppercase letters)', async () => {
      let defaultUser = await orchestrator.createUser({
        username: 'DIFFERENTuppercase',
      });
      defaultUser = await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/DIFFERENTuppercase`, {
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
      expect(responseBody.error_unique_code).toEqual('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
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
      expect(responseBody.message).toEqual('"username" possui o valor inválido "null".');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('username');
    });

    test('With "username" in blocked list', async () => {
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
          username: 'admin',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Este nome de usuário não está disponível para uso.');
      expect(responseBody.action).toEqual('Escolha outro nome de usuário e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:USER:CHECK_BLOCKED_USERNAMES:BLOCKED_USERNAME');
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
      expect(responseBody.message).toEqual('Body enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.message).toEqual('Body enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.key).toEqual('object');
    });

    describe('TEMPORARY BEHAVIOR', () => {
      test('Patching itself with another "email"', async () => {
        let defaultUser = await orchestrator.createUser({
          email: 'this.email.will.not@change.com',
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
            email: 'CHANGE.MY@EMAIL.com',
          }),
        });

        const responseBody = await response.json();

        expect(response.status).toEqual(200);
        expect(uuidVersion(responseBody.id)).toEqual(4);
        expect(defaultUser.id).toEqual(responseBody.id);
        expect(responseBody.username).toEqual(defaultUser.username);
        expect(responseBody.features).toEqual(defaultUser.features);
        expect(responseBody.created_at).toEqual(defaultUser.created_at.toISOString());
        expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);
        expect(responseBody).not.toHaveProperty('password');
        expect(responseBody).not.toHaveProperty('email');

        const defaultUserInDatabase = await user.findOneById(responseBody.id);
        const passwordsMatch = await password.compare('password', defaultUserInDatabase.password);
        expect(passwordsMatch).toBe(true);

        const userInDatabase = await user.findOneById(responseBody.id);
        expect(userInDatabase.email).toEqual('this.email.will.not@change.com');
      });

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

        const responseBody = await response.json();

        expect(response.status).toEqual(200);
        expect(uuidVersion(responseBody.id)).toEqual(4);
        expect(defaultUser.id).toEqual(responseBody.id);
        expect(responseBody.username).toEqual(defaultUser.username);
        expect(responseBody.features).toEqual(defaultUser.features);
        expect(responseBody.created_at).toEqual(defaultUser.created_at.toISOString());
        expect(responseBody.updated_at > defaultUser.created_at.toISOString()).toBe(true);
        expect(responseBody).not.toHaveProperty('password');
        expect(responseBody).not.toHaveProperty('email');

        const defaultUserInDatabase = await user.findOneById(responseBody.id);
        const passwordsMatch = await password.compare('thisPasswordWillNotChange', defaultUserInDatabase.password);
        const wrongPasswordMatch = await password.compare('CHANGE.MY.PASSWORD', defaultUserInDatabase.password);
        expect(passwordsMatch).toBe(true);
        expect(wrongPasswordMatch).toBe(false);
      });
    });
  });
});
