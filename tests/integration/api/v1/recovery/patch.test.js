import { version as uuidVersion } from 'uuid';

import recovery from 'models/recovery.js';
import user from 'models/user.js';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe('PATCH /api/v1/recovery', () => {
  describe('Anonymous user', () => {
    test('With valid information', async () => {
      const defaultUser = await orchestrator.createUser();
      const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: recoveryToken.id,
          password: 'newValidPassword',
        }),
      });

      const responseBody = await response.json();

      const updatedTokenInDatabase = await recovery.findOneTokenById(recoveryToken.id);
      const updatedUserInDatabase = await user.findOneById(defaultUser.id);

      expect.soft(response.status).toBe(200);

      expect(responseBody).toStrictEqual({
        used: true,
        expires_at: updatedTokenInDatabase.expires_at.toISOString(),
        created_at: updatedTokenInDatabase.created_at.toISOString(),
        updated_at: updatedTokenInDatabase.updated_at.toISOString(),
      });

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.expires_at > responseBody.created_at).toBe(true);
      expect(responseBody.updated_at > recoveryToken.updated_at.toISOString()).toBe(true);

      expect(defaultUser.password).not.toBe(updatedUserInDatabase.password);
    });

    test('With valid information and multiple active sessions', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const session1Object = await orchestrator.createSession(defaultUser);
      const session2Object = await orchestrator.createSession(defaultUser);

      // First: test if both sessions are working
      const validSession1Response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${session1Object.token}`,
        },
      });

      const validSession2Response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${session2Object.token}`,
        },
      });

      expect.soft(validSession1Response.status).toBe(200);
      const validSession1ResponseBody = await validSession1Response.json();
      expect(validSession1ResponseBody.id).toBe(defaultUser.id);

      expect.soft(validSession2Response.status).toBe(200);
      const validSession2ResponseBody = await validSession2Response.json();
      expect(validSession2ResponseBody.id).toBe(defaultUser.id);

      // Second: define new password for user using the recovery endpoint
      const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);

      const recoveryResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: recoveryToken.id,
          password: 'newValidPassword',
        }),
      });

      expect.soft(recoveryResponse.status).toBe(200);

      // Third: test if both sessions are invalid
      const invalidSession1Response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${session1Object.token}`,
        },
      });

      const invalidSession2Response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        method: 'GET',
        headers: {
          cookie: `session_id=${session2Object.token}`,
        },
      });

      expect.soft(invalidSession1Response.status).toBe(401);
      expect.soft(invalidSession2Response.status).toBe(401);
    });

    test('With valid information, but used token', async () => {
      const defaultUser = await orchestrator.createUser();
      const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);
      await recovery.update(recoveryToken.id, {
        used: true,
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: recoveryToken.id,
          password: 'newValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.',
        action: 'Solicite uma nova recuperação de senha.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:RECOVERY:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
        key: 'token_id',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With valid information, but expired token', async () => {
      const defaultUser = await orchestrator.createUser();
      const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);
      await recovery.update(recoveryToken.id, {
        expires_at: new Date(Date.now() - 1000),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: recoveryToken.id,
          password: 'newValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.',
        action: 'Solicite uma nova recuperação de senha.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:RECOVERY:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
        key: 'token_id',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With valid information, but non-existent token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: 'b04b9c47-3120-4191-8b1a-000334de95ae',
          password: 'newValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O token de recuperação de senha utilizado não foi encontrado no sistema ou expirou.',
        action: 'Solicite uma nova recuperação de senha.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:RECOVERY:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
        key: 'token_id',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With valid data and TOTP enabled', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const userTotp = await orchestrator.enableTotp(defaultUser);
      const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);

      const recoveryRequestBuilder = new RequestBuilder('/api/v1/recovery');

      const { response, responseBody } = await recoveryRequestBuilder.patch({
        token_id: recoveryToken.id,
        password: 'newValidPassword',
        totp_token: userTotp.generate(),
      });

      const updatedTokenInDatabase = await recovery.findOneTokenById(recoveryToken.id);
      const updatedUserInDatabase = await user.findOneById(defaultUser.id);

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({
        used: true,
        expires_at: updatedTokenInDatabase.expires_at.toISOString(),
        created_at: updatedTokenInDatabase.created_at.toISOString(),
        updated_at: updatedTokenInDatabase.updated_at.toISOString(),
      });

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.expires_at > responseBody.created_at).toBe(true);
      expect(responseBody.updated_at > recoveryToken.updated_at.toISOString()).toBe(true);

      expect(defaultUser.password).not.toBe(updatedUserInDatabase.password);
    });

    test('With valid data and TOTP enabled, but sending an invalid "totp_token"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const userTotp = await orchestrator.enableTotp(defaultUser);
      const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);

      const recoveryRequestBuilder = new RequestBuilder('/api/v1/recovery');

      const { response, responseBody } = await recoveryRequestBuilder.patch({
        token_id: recoveryToken.id,
        password: 'newValidPassword',
        totp_token: orchestrator.getInvalidTotpToken(userTotp),
      });

      expect.soft(response.status).toBe(401);
      expect(responseBody).toStrictEqual({
        name: 'UnauthorizedError',
        message: 'O código TOTP informado é inválido.',
        action: 'Verifique o código e tente novamente.',
        status_code: 401,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:RECOVERY:PATCH_HANDLER:TOTP_INVALID',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const updatedTokenInDatabase = await recovery.findOneTokenById(recoveryToken.id);
      expect(updatedTokenInDatabase).toStrictEqual(recoveryToken);
    });

    test('With valid data and TOTP enabled, but not sending "totp_token"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      await orchestrator.enableTotp(defaultUser);
      const recoveryToken = await orchestrator.createRecoveryToken(defaultUser);

      const recoveryRequestBuilder = new RequestBuilder('/api/v1/recovery');

      const { response, responseBody } = await recoveryRequestBuilder.patch({
        token_id: recoveryToken.id,
        password: 'newValidPassword',
      });

      expect.soft(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: `"totp_token" é um campo obrigatório.`,
        action: `Ajuste os dados enviados e tente novamente.`,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'totp_token',
        type: 'any.required',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const updatedTokenInDatabase = await recovery.findOneTokenById(recoveryToken.id);
      expect(updatedTokenInDatabase).toStrictEqual(recoveryToken);
    });

    test('With "token_id" missing', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          password: 'newValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"token_id" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'token_id',
        type: 'any.required',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With "token_id" as a Number', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: 123456,
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"token_id" deve ser do tipo String.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'token_id',
        type: 'string.base',
      });
    });

    test('With "token_id" as a String, but not in UUID V4 format', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: 'abcd',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"token_id" deve possuir um token UUID na versão 4.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'token_id',
        type: 'string.guid',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With "password" missing', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: '6f03567c-dc1b-4e07-9775-8bc71a08c4d6',
        }),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"password" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'password',
        type: 'any.required',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    // -------

    test('With blank Body', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"body" enviado deve ser do tipo Object.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'object',
        type: 'object.base',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With blank Object', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/recovery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect.soft(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"token_id" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'token_id',
        type: 'any.required',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });
});
