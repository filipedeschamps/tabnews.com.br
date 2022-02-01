import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import user from 'models/user.js';
import password from 'models/password.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users', () => {
  describe('in an empty database', () => {
    test('should return an empty array', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody).toEqual([]);
    });
  });

  describe('with two users in database', () => {
    test('should return an array with two users', async () => {
      const user1Response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user1',
          email: 'user1@gmail.com',
          password: 'validpassword',
        }),
      });

      const user2Response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'user2',
          email: 'user2@gmail.com',
          password: 'validpassword',
        }),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`);
      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(responseBody.length).toEqual(2);

      expect(uuidVersion(responseBody[0].id)).toEqual(4);
      expect(uuidValidate(responseBody[0].id)).toEqual(true);
      expect(responseBody[0].username).toEqual('user1');
      expect(responseBody[0].email).toEqual('user1@gmail.com');
      expect(Date.parse(responseBody[0].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[0].updated_at)).not.toEqual(NaN);
      expect(responseBody[0]).not.toHaveProperty('password');

      expect(uuidVersion(responseBody[1].id)).toEqual(4);
      expect(uuidValidate(responseBody[1].id)).toEqual(true);
      expect(responseBody[1].username).toEqual('user2');
      expect(responseBody[1].email).toEqual('user2@gmail.com');
      expect(Date.parse(responseBody[1].created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody[1].updated_at)).not.toEqual(NaN);
      expect(responseBody[1]).not.toHaveProperty('password');
    });
  });
});

describe('POST /api/v1/users', () => {
  describe('with unique and valid data', () => {
    test('should return the created user', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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

      const createdUser = await user.findOneByUsername('uniqueUserName');
      const passwordsMatch = await password.compare('validpassword', createdUser.password);
      const wrongPasswordMatch = await password.compare('wrongpassword', createdUser.password);

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(responseBody.username).toEqual('uniqueUserName');
      expect(responseBody.email).toEqual('validemailcaps@gmail.com');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
      expect(passwordsMatch).toBe(true);
      expect(wrongPasswordMatch).toBe(false);
    });
  });

  describe('with unique and valid data, and an unknown key', () => {
    test('should return the created user without this unknown key', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(responseBody.username).toEqual('postWithUnknownKey');
      expect(responseBody.email).toEqual('postwithunknownkey@gmail.com');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
      expect(responseBody).not.toHaveProperty('unknownKey');
    });
  });

  describe('with unique and valid data, but with "untrimmed" values', () => {
    test('should return the created user with trimmed values', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(responseBody.username).toEqual('extraSpaceInTheEnd');
      expect(responseBody.email).toEqual('space.in.the.beggining@gmail.com');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('password');
    });
  });

  describe('with "username" duplicated exactly (same uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
        method: 'post',
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
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O username "SaMeUPPERCASE" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" duplicated (different uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
        method: 'post',
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
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O username "differentUPPERCASE" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" missing', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" with an empty string', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" that\'s not a String', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" containing non alphanumeric characters', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" too short', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'ab',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no mínimo 3 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" too long', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'userNameTooLooooooooooooooooooooooooooog',
          email: 'valid@email.com',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter no máximo 30 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" duplicated (same uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'anotherUserName111',
          email: 'email.will.be.duplicated@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O email "email.will.be.duplicated@gmail.com" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" duplicated (different uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'willTryToReuseEmail111',
          email: 'CAPS@gmail.com',
          password: 'validpassword',
        }),
      });

      const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(secondResponse.status).toEqual(400);
      expect(secondResponseBody.name).toEqual('ValidationError');
      expect(secondResponseBody.message).toEqual('O email "caps@gmail.com" já está sendo usado.');
      expect(secondResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(secondResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(secondResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(secondResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" missing', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          password: 'validpassword123',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" with an empty string', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" that\'s not a String', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" with invalid format', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" deve conter um email válido.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" missing', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" with an empty string', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" that\'s not a String', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" too short', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'notUsedUserName',
          email: 'notusedemail@gmail.com',
          password: '1234567',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve conter no mínimo 8 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with "password" too long', () => {
    test('should return a ValidationError', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
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
      expect(response.status).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve conter no máximo 72 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });
});
