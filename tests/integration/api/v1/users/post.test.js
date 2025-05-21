import { version as uuidVersion } from 'uuid';

import password from 'models/password.js';
import user from 'models/user.js';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/users', () => {
  describe('Anonymous user', () => {
    test('With unique and valid data', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'uniqueUserName',
          email: 'validemailCAPS@gmail.com',
          password: 'validpassword',
        }),
      });
      const responseBody = await response.json();

      expect.soft(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        username: 'uniqueUserName',
        description: '',
        features: ['read:activation_token'],
        tabcoins: 0,
        tabcash: 0,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername('uniqueUserName');
      const passwordsMatch = await password.compare('validpassword', userInDatabase.password);
      const wrongPasswordMatch = await password.compare('wrongpassword', userInDatabase.password);

      expect(passwordsMatch).toBe(true);
      expect(wrongPasswordMatch).toBe(false);
      expect(userInDatabase.email).toBe('validemailcaps@gmail.com');
    });

    test('With unique and valid data, and an unknown key', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'postWithUnknownKey',
          email: 'postWithUnknownKey@gmail.com',
          password: 'validpassword',
          unknownKey: 'unknownValue',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        username: 'postWithUnknownKey',
        description: '',
        features: ['read:activation_token'],
        tabcoins: 0,
        tabcash: 0,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneById(responseBody.id);
      expect(userInDatabase.email).toBe('postwithunknownkey@gmail.com');
    });

    test('With unique and valid data, but with "untrimmed" values', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'extraSpaceInTheEnd ',
          email: ' space.in.the.beggining@gmail.com',
          password: 'validpassword ',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        username: 'extraSpaceInTheEnd',
        description: '',
        features: ['read:activation_token'],
        tabcoins: 0,
        tabcash: 0,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername('extraSpaceInTheEnd');
      const passwordsMatch = await password.compare('validpassword', userInDatabase.password);
      const wrongPasswordMatch = await password.compare('validpassword ', userInDatabase.password);

      expect(passwordsMatch).toBe(true);
      expect(wrongPasswordMatch).toBe(false);
      expect(userInDatabase.email).toBe('space.in.the.beggining@gmail.com');
    });

    test('With "username" missing', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('username');
    });

    test('With "username" with a null value', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: null,
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('username');
    });

    test('With "username" with an empty string', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: '',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('username');
    });

    test('With "username" that\'s not a String', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 12345,
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('username');
    });

    test('With "username" containing non alphanumeric characters', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'invalid!user_name',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('username');
    });

    test('With "username" too long', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'userWith31Characterssssssssssss',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"username" deve conter no máximo 30 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('username');
    });

    test('With "username" in blocked list', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'administrator',
          email: 'admin@email.com',
          password: 'validpassword123',
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

    test('With "email" missing', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('With "email" with an empty string', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: '',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('With "email" that\'s not a String', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 12345,
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('With "email" with invalid format', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'not.used.email@gmail.com@what',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" deve conter um email válido.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('With "password" missing', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('With "password" with an empty string', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: '',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('With "password" that\'s not a String', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: 123456,
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('With "password" too short', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: '<8chars',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" deve conter no mínimo 8 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('With "password" too long', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: '73characterssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" deve conter no máximo 72 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('With "body" totally blank', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('object');
    });

    test('With "body" containing a String', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'POST',
        body: "Please don't hack us, we are the good guys!",
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);
      expect.soft(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('object');
    });

    describe('With duplicated "username" and/or "email"', () => {
      test('With "username" duplicated exactly (same uppercase letters)', async () => {
        // firstResponse
        await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'SaMeUPPERCASE',
            email: 'email01@gmail.com',
            password: 'validpassword',
          }),
        });

        const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'SaMeUPPERCASE',
            email: 'email02@gmail.com',
            password: 'validpassword',
          }),
        });

        const secondResponseBody = await secondResponse.json();

        expect.soft(secondResponse.status).toBe(400);
        expect.soft(secondResponseBody.status_code).toBe(400);
        expect(secondResponseBody.name).toBe('ValidationError');
        expect(secondResponseBody.message).toBe('O "username" informado já está sendo usado.');
        expect(secondResponseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
        expect(uuidVersion(secondResponseBody.error_id)).toBe(4);
        expect(uuidVersion(secondResponseBody.request_id)).toBe(4);
        expect(secondResponseBody.error_location_code).toBe('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
        expect(secondResponseBody.key).toBe('username');
      });

      test('With "username" duplicated (different uppercase letters)', async () => {
        // firstResponse
        await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'DIFFERENTuppercase',
            email: 'email03@gmail.com',
            password: 'validpassword',
          }),
        });

        const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'differentUPPERCASE',
            email: 'email04@gmail.com',
            password: 'validpassword',
          }),
        });

        const secondResponseBody = await secondResponse.json();

        expect.soft(secondResponse.status).toBe(400);
        expect.soft(secondResponseBody.status_code).toBe(400);
        expect(secondResponseBody.name).toBe('ValidationError');
        expect(secondResponseBody.message).toBe('O "username" informado já está sendo usado.');
        expect(secondResponseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
        expect(uuidVersion(secondResponseBody.error_id)).toBe(4);
        expect(uuidVersion(secondResponseBody.request_id)).toBe(4);
        expect(secondResponseBody.error_location_code).toBe('MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS');
        expect(secondResponseBody.key).toBe('username');
      });

      test('With "email" duplicated (same uppercase letters)', async () => {
        const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'anotherUserName111',
            email: 'email.will.be.duplicated@gmail.com',
            password: 'validpassword',
          }),
        });

        const firstResponseBody = await firstResponse.json();

        const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'anotherUserName222',
            email: 'email.will.be.duplicated@gmail.com',
            password: 'validpassword',
          }),
        });

        const secondResponseBody = await secondResponse.json();

        expect.soft(secondResponse.status).toBe(201);

        expect(secondResponseBody).toStrictEqual({
          id: secondResponseBody.id,
          username: 'anotherUserName222',
          description: '',
          features: ['read:activation_token'],
          tabcoins: 0,
          tabcash: 0,
          created_at: secondResponseBody.created_at,
          updated_at: secondResponseBody.updated_at,
        });
        expect(uuidVersion(secondResponseBody.id)).toBe(4);
        expect(Date.parse(secondResponseBody.created_at)).not.toBeNaN();
        expect(Date.parse(secondResponseBody.updated_at)).not.toBeNaN();

        await expect(user.findOneById(firstResponseBody.id)).resolves.not.toThrow();

        await expect(user.findOneById(secondResponseBody.id)).rejects.toThrow(
          `O id "${secondResponseBody.id}" não foi encontrado no sistema.`,
        );
      });

      test('With "email" duplicated (different uppercase letters)', async () => {
        const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'willTryToReuseEmail111',
            email: 'CAPS@gmail.com',
            password: 'validpassword',
          }),
        });

        const firstResponseBody = await firstResponse.json();

        const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'willTryToReuseEmail222',
            email: 'caps@gmail.com',
            password: 'validpassword',
          }),
        });

        const secondResponseBody = await secondResponse.json();

        expect.soft(secondResponse.status).toBe(201);

        expect(secondResponseBody).toStrictEqual({
          id: secondResponseBody.id,
          username: 'willTryToReuseEmail222',
          description: '',
          features: ['read:activation_token'],
          tabcoins: 0,
          tabcash: 0,
          created_at: secondResponseBody.created_at,
          updated_at: secondResponseBody.updated_at,
        });
        expect(uuidVersion(secondResponseBody.id)).toBe(4);
        expect(Date.parse(secondResponseBody.created_at)).not.toBeNaN();
        expect(Date.parse(secondResponseBody.updated_at)).not.toBeNaN();

        await expect(user.findOneById(firstResponseBody.id)).resolves.not.toThrow();

        await expect(user.findOneById(secondResponseBody.id)).rejects.toThrow(
          `O id "${secondResponseBody.id}" não foi encontrado no sistema.`,
        );
      });
    });
  });
});
