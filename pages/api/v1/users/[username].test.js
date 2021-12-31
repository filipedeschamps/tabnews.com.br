import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import orchestratorFactory from 'tests/orchestrator.js';

const orchestrator = orchestratorFactory();

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users/:username', () => {
  describe('if "username" does not exists', () => {
    test('should return a NotFound error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexist`);
      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O username "donotexist" não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('if "username" does exists (same uppercase letters)', () => {
    test('should return the user object', async () => {
      const userCreatedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'userNameToBeFound',
          email: 'userEmail@gmail.com',
          password: 'validpassword',
        }),
      });

      const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userNameToBeFound`);
      const userFindResponseBody = await userFindResponse.json();

      expect(userFindResponse.status).toEqual(200);
      expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
      expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
      expect(userFindResponseBody.username).toEqual('userNameToBeFound');
      expect(userFindResponseBody.email).toEqual('useremail@gmail.com');
    });
  });

  describe('if "username" does exists (different uppercase letters)', () => {
    test('should return the user object', async () => {
      const userCreatedResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'userNameToBeFoundCAPS',
          email: 'userEmailToBeFoundCAPS@gmail.com',
          password: 'validpassword',
        }),
      });

      const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/usernametobefoundcaps`);
      const userFindResponseBody = await userFindResponse.json();

      expect(userFindResponse.status).toEqual(200);
      expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
      expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
      expect(userFindResponseBody.username).toEqual('userNameToBeFoundCAPS');
      expect(userFindResponseBody.email).toEqual('useremailtobefoundcaps@gmail.com');
    });
  });
});

describe('PATCH /api/v1/users/:username', () => {
  describe('if "username" does not exists', () => {
    test('should return a NotFound error', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/donotexistpatch`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'donotexistpatch@gmail.com',
          password: 'validpassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O username "donotexistpatch" não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(uuidVersion(responseBody.errorId)).toEqual(4);
      expect(uuidValidate(responseBody.errorId)).toEqual(true);
      expect(uuidVersion(responseBody.requestId)).toEqual(4);
      expect(uuidValidate(responseBody.requestId)).toEqual(true);
    });
  });

  describe('with existing username and new "username"', () => {
    test('should return updated user data', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'CURRENTusername',
          email: 'CURRENTusername@gmail.com',
          password: 'validpassword',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/CURRENTusername`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'NEWusername',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(200);
      expect(uuidVersion(patchUserResponseBody.id)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.id)).toEqual(true);
      expect(patchUserResponseBody.username).toEqual('NEWusername');
      expect(patchUserResponseBody.email).toEqual('currentusername@gmail.com');
      expect(Date.parse(patchUserResponseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(patchUserResponseBody.updated_at)).not.toEqual(NaN);
      expect(patchUserResponseBody).not.toHaveProperty('password');
    });
  });

  describe('with existing username but already used "username"', () => {
    test('should return a ValidationError', async () => {
      const createFirstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'firstUserPatch',
          email: 'firstUserPatch@gmail.com',
          password: 'validpassword',
        }),
      });

      const createSecondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'secondUserPatch',
          email: 'secondUserPatch@gmail.com',
          password: 'validpassword',
        }),
      });

      const patchSecondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/secondUserPatch`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'firstUserPatch',
        }),
      });

      const patchSecondUserBody = await patchSecondUserResponse.json();

      expect(patchSecondUserResponse.status).toEqual(400);
      expect(patchSecondUserBody.name).toEqual('ValidationError');
      expect(patchSecondUserBody.message).toEqual('O username "firstUserPatch" já está sendo usado.');
      expect(patchSecondUserBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchSecondUserBody.errorId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.errorId)).toEqual(true);
      expect(uuidVersion(patchSecondUserBody.requestId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.requestId)).toEqual(true);
    });
  });

  describe('with existing username and new "email"', () => {
    test('should return updated user data', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'currentusernameemail',
          email: 'CURRENTemail@gmail.com',
          password: 'validpassword',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/currentusernameemail`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'NEWemail@gmail.com',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(200);
      expect(uuidVersion(patchUserResponseBody.id)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.id)).toEqual(true);
      expect(patchUserResponseBody.username).toEqual('currentusernameemail');
      expect(patchUserResponseBody.email).toEqual('newemail@gmail.com');
      expect(Date.parse(patchUserResponseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(patchUserResponseBody.updated_at)).not.toEqual(NaN);
      expect(patchUserResponseBody).not.toHaveProperty('password');
    });
  });

  describe('with existing username but already used "email"', () => {
    test('should return a ValidationError', async () => {
      const createFirstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'firstUserPatchEmail',
          email: 'firstUserPatchEmail@gmail.com',
          password: 'validpassword',
        }),
      });

      const createSecondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'secondUserPatchEmail',
          email: 'secondUserPatchEmail@gmail.com',
          password: 'validpassword',
        }),
      });

      const patchSecondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/secondUserPatchEmail`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'firstUserPatchEmail@gmail.com',
        }),
      });

      const patchSecondUserBody = await patchSecondUserResponse.json();

      expect(patchSecondUserResponse.status).toEqual(400);
      expect(patchSecondUserBody.name).toEqual('ValidationError');
      expect(patchSecondUserBody.message).toEqual('O email "firstuserpatchemail@gmail.com" já está sendo usado.');
      expect(patchSecondUserBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchSecondUserBody.errorId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.errorId)).toEqual(true);
      expect(uuidVersion(patchSecondUserBody.requestId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.requestId)).toEqual(true);
    });
  });
});
