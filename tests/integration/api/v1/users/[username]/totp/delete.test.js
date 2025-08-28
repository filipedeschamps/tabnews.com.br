import { version as uuidVersion } from 'uuid';

import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/users/[username]/totp', () => {
  describe('Anonymous user', () => {
    test('With a non-existent user', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');

      const { response, responseBody } = await requestBuilder.delete(`/userDoesNotExist/totp`, {
        totp_token: '123456',
        password: 'anyPassword',
      });

      expect.soft(response.status).toBe(403);
      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:session".',
        status_code: 403,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an existent user', async () => {
      await orchestrator.createUser({ username: 'anotherUser' });
      const requestBuilder = new RequestBuilder('/api/v1/users');

      const { response, responseBody } = await requestBuilder.delete(`/anotherUser/totp`, {
        totp_token: '123456',
        password: 'anyPassword',
      });

      expect.soft(response.status).toBe(403);
      expect(responseBody).toStrictEqual({
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "read:session".',
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
    test('With a valid token and password for an existent TOTP', async () => {
      const createdUser = await orchestrator.createUser({ password: 'validPassword' });
      await orchestrator.activateUser(createdUser);
      const createdUserSession = await orchestrator.createSession(createdUser);
      const userTotp = await orchestrator.enableTotp(createdUser);

      const userBefore = await user.findOneById(createdUser.id);
      expect(userBefore.totp_secret).not.toBeNull();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${createdUser.username}/totp`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${createdUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: userTotp.generate(),
          password: 'validPassword',
        }),
      });

      expect.soft(response.status).toBe(204);

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.totp_secret).toBeNull();
    });

    test('With TOTP disabled', async () => {
      const createdUser = await orchestrator.createUser({ password: 'password' });
      await orchestrator.activateUser(createdUser);
      const createdUserSession = await orchestrator.createSession(createdUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${createdUser.username}/totp`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${createdUserSession.token}`,
        },
        body: JSON.stringify({
          totp_token: '123456',
          password: 'password',
        }),
      });

      expect.soft(response.status).toBe(204);

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.totp_secret).toBeNull();
    });

    test('Without "password" in body', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.delete(`/${createdUser.username}/totp`, {
        totp_token: '123456',
      });

      expect.soft(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: `"password" é um campo obrigatório.`,
        action: 'Ajuste os dados enviados e tente novamente.',
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'password',
        type: 'any.required',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('Without "token" in body', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser({ password: 'validPassword' });

      const { response, responseBody } = await requestBuilder.delete(`/${createdUser.username}/totp`, {
        password: 'validPassword',
      });

      expect.soft(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: `"totp_token" é um campo obrigatório.`,
        action: 'Ajuste os dados enviados e tente novamente.',
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'totp_token',
        type: 'any.required',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With a token too long', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.delete(`/${createdUser.username}/totp`, {
        totp_token: '12345678',
        password: 'password',
      });

      expect.soft(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: `"totp_token" deve possuir 6 caracteres.`,
        action: 'Ajuste os dados enviados e tente novamente.',
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'totp_token',
        type: 'string.length',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an invalid token', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser({ password: 'password' });
      const userTotp = await orchestrator.enableTotp(createdUser);

      const { response, responseBody } = await requestBuilder.delete(`/${createdUser.username}/totp`, {
        totp_token: orchestrator.getInvalidTotpToken(userTotp),
        password: 'password',
      });

      expect.soft(response.status).toBe(401);
      expect(responseBody).toStrictEqual({
        status_code: 401,
        name: 'UnauthorizedError',
        message: 'Dados não conferem.',
        action: 'Verifique se a senha e o código TOTP informados estão corretos.',
        error_location_code: 'CONTROLLER:USER_TOTP:DELETE_HANDLER:DATA_MISMATCH',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.totp_secret).not.toBeNull();
    });

    test('With an invalid password', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser({ password: 'correct-password' });
      const userTotp = await orchestrator.enableTotp(createdUser);

      const { response, responseBody } = await requestBuilder.delete(`/${createdUser.username}/totp`, {
        totp_token: userTotp.generate(),
        password: 'invalid-password',
      });

      expect.soft(response.status).toBe(401);
      expect(responseBody).toStrictEqual({
        status_code: 401,
        name: 'UnauthorizedError',
        message: 'Dados não conferem.',
        action: 'Verifique se a senha e o código TOTP informados estão corretos.',
        error_location_code: 'CONTROLLER:USER_TOTP:DELETE_HANDLER:DATA_MISMATCH',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.totp_secret).not.toBeNull();
    });

    test("Should not disable another user's TOTP", async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      await requestBuilder.buildUser({ password: 'correct-password' });

      const targetUser = await orchestrator.createUser({ username: 'targetUser' });
      await orchestrator.activateUser(targetUser);
      await orchestrator.enableTotp(targetUser);

      const { response, responseBody } = await requestBuilder.delete(`/targetUser/totp`, {
        totp_token: '123456',
        password: 'invalid-password',
      });

      expect.soft(response.status).toBe(403);
      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Não é possível obter ou modificar o TOTP de outro usuário.',
        action: 'Altere o usuário na requisição.',
        error_location_code: 'CONTROLLER:USER_TOTP:VALIDATE_IS_SAME_USER',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const targetUserInDatabase = await user.findOneById(targetUser.id);
      expect(targetUserInDatabase.totp_secret).not.toBeNull();
    });
  });
});
