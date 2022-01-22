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
        }),
      });

      const userCreatedResponseBody = await userCreatedResponse.json();

      const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/userNameToBeFound`);
      const userFindResponseBody = await userFindResponse.json();

      expect(userFindResponse.status).toEqual(200);
      expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
      expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
      expect(userCreatedResponseBody.id).toEqual(userFindResponseBody.id);
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
        }),
      });

      const userCreatedResponseBody = await userCreatedResponse.json();

      const userFindResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/usernametobefoundcaps`);
      const userFindResponseBody = await userFindResponse.json();

      expect(userFindResponse.status).toEqual(200);
      expect(uuidVersion(userFindResponseBody.id)).toEqual(4);
      expect(uuidValidate(userFindResponseBody.id)).toEqual(true);
      expect(userCreatedResponseBody.id).toEqual(userFindResponseBody.id);
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

  describe('with unique and valid data, and an unknown key', () => {
    test('should return the created user without this unknown key', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'patchWithUnknownKey',
          email: 'patchWithUnknownKey@gmail.com',
        }),
      });

      const createUserResponseBody = await createUserResponse.json();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/patchWithUnknownKey`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'patchWithUnknownKeyNEW',
          email: 'patchWithUnknownKeyNEW@gmail.com',
          unknownKey: 'unknownValue',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(createUserResponseBody.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('patchWithUnknownKeyNEW');
      expect(responseBody.email).toEqual('patchwithunknownkeynew@gmail.com');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody).not.toHaveProperty('unknownKey');
    });
  });

  describe('with unique and valid data, but with "untrimmed" values', () => {
    test('should return the created user with trimmed values', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'willpatchwithextraspace',
          email: 'willpatchwithextraspace@gmail.com',
        }),
      });

      const createUserResponseBody = await createUserResponse.json();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/willpatchwithextraspace`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'extraSpaceInTheEnd ',
          email: ' space.in.the.beggining@gmail.com',
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidValidate(responseBody.id)).toEqual(true);
      expect(createUserResponseBody.id).toEqual(responseBody.id);
      expect(responseBody.username).toEqual('extraSpaceInTheEnd');
      expect(responseBody.email).toEqual('space.in.the.beggining@gmail.com');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
    });
  });

  describe('with existing username and new and unique "username"', () => {
    test('should return updated user data', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'CURRENTusername',
          email: 'CURRENTusername@gmail.com',
        }),
      });

      const createUserResponseBody = await createUserResponse.json();

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
      expect(createUserResponseBody.id).toEqual(patchUserResponseBody.id);
      expect(patchUserResponseBody.username).toEqual('NEWusername');
      expect(patchUserResponseBody.email).toEqual('currentusername@gmail.com');
      expect(Date.parse(patchUserResponseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(patchUserResponseBody.updated_at)).not.toEqual(NaN);
    });
  });

  describe('with existing username but already used "username" (same uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const createFirstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'firstUserPatch',
          email: 'firstUserPatch@gmail.com',
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

  describe('with existing username but already used "username" (different uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const createFirstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'DIFFERENTuppercaseletters',
          email: 'DIFFERENTuppercaseletters@gmail.com',
        }),
      });

      const createSecondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'randomuser23y2876487',
          email: 'randomuser23y2876487@gmail.com',
        }),
      });

      const patchSecondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/randomuser23y2876487`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'differentUPPERCASEletters',
        }),
      });

      const patchSecondUserBody = await patchSecondUserResponse.json();

      expect(patchSecondUserResponse.status).toEqual(400);
      expect(patchSecondUserBody.name).toEqual('ValidationError');
      expect(patchSecondUserBody.message).toEqual('O username "differentUPPERCASEletters" já está sendo usado.');
      expect(patchSecondUserBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchSecondUserBody.errorId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.errorId)).toEqual(true);
      expect(uuidVersion(patchSecondUserBody.requestId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" with an empty String', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'emptyString',
          email: 'emptyString@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/CURRENTusername`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: '',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"username" não pode estar em branco.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" that\'s not a String', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'NumberUser',
          email: 'NumberUser@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/NumberUser`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 123456,
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"username" deve ser do tipo String.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" containing non alphanumeric characters', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'validuserwithnoalphanumeric',
          email: 'validuserwithnoalphanumeric@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/validuserwithnoalphanumeric`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'invalid!user_name',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"username" deve conter apenas caracteres alfanuméricos.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" too short', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'correctLengthUser',
          email: 'correctLengthUser@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/correctLengthUser`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'cd',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"username" deve conter no mínimo 3 caracteres.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "username" too long', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'willbetoolong',
          email: 'willbetoolong@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/willbetoolong`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'willbetooloooooooooooooooooooooooooooooooooooooooooooooong',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"username" deve conter no máximo 30 caracteres.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
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
    });
  });

  describe('with existing username but already used "email" (same uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const createFirstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'firstUserPatchEmail',
          email: 'firstUserPatchEmail@gmail.com',
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

  describe('with existing username but already used "email" (different uppercase letters)', () => {
    test('should return a ValidationError', async () => {
      const createFirstUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'emailDIFFERENTuppercase1',
          email: 'emailDIFFERENTuppercase1@gmail.com',
        }),
      });

      const createSecondUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'emailDIFFERENTuppercase2',
          email: 'emailDIFFERENTuppercase2@gmail.com',
        }),
      });

      const patchSecondUserResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/users/emailDIFFERENTuppercase2`,
        {
          method: 'patch',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'EMAILdifferentUPPERCASE1@gmail.com',
          }),
        }
      );

      const patchSecondUserBody = await patchSecondUserResponse.json();

      expect(patchSecondUserResponse.status).toEqual(400);
      expect(patchSecondUserBody.name).toEqual('ValidationError');
      expect(patchSecondUserBody.message).toEqual('O email "emaildifferentuppercase1@gmail.com" já está sendo usado.');
      expect(patchSecondUserBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchSecondUserBody.errorId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.errorId)).toEqual(true);
      expect(uuidVersion(patchSecondUserBody.requestId)).toEqual(4);
      expect(uuidValidate(patchSecondUserBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" with an empty String', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'emptyStringEmail',
          email: 'emptyStringEmail@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/emptyStringEmail`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"email" não pode estar em branco.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" that\'s not a String', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'NumberEmail',
          email: 'NumberEmail@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/NumberEmail`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 123456,
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"email" deve ser do tipo String.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
    });
  });

  describe('with "email" with invalid format', () => {
    test('should return a ValidationError', async () => {
      const createUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'validuserwithnoalphanumeric',
          email: 'validuserwithnoalphanumeric@gmail.com',
        }),
      });

      const patchUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/validuserwithnoalphanumeric`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'not.used.email@gmail.com@what',
        }),
      });

      const patchUserResponseBody = await patchUserResponse.json();

      expect(patchUserResponse.status).toEqual(400);
      expect(patchUserResponseBody.name).toEqual('ValidationError');
      expect(patchUserResponseBody.message).toEqual('"email" deve conter um email válido.');
      expect(patchUserResponseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(patchUserResponseBody.errorId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.errorId)).toEqual(true);
      expect(uuidVersion(patchUserResponseBody.requestId)).toEqual(4);
      expect(uuidValidate(patchUserResponseBody.requestId)).toEqual(true);
    });
  });
});
