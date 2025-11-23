import { version as uuidVersion } from 'uuid';

import encryption from 'models/encryption';
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

      const { response, responseBody } = await requestBuilder.patch(`/userDoesNotExist/totp`, {
        totp_token: '123456',
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
      const createdUser = await orchestrator.createUser({ username: 'anotherUser' });
      const requestBuilder = new RequestBuilder('/api/v1/users');

      const { response, responseBody } = await requestBuilder.patch(`/anotherUser/totp`, {
        totp_token: '123456',
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

      const tempTotp = await orchestrator.findTemporaryTotpByUser(createdUser);
      expect(tempTotp).toBeUndefined();
    });
  });

  describe('Default user', () => {
    test('With a valid token for an existent TOTP', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const userTotp = await orchestrator.createTemporaryTotp(createdUser);

      const { response, responseBody } = await requestBuilder.patch(`/${createdUser.username}/totp`, {
        totp_token: userTotp.generate(),
      });

      expect.soft(response.status).toBe(200);
      expect(responseBody).toStrictEqual({ totp_enabled: true });

      const updatedUser = await user.findOneById(createdUser.id);
      expect(updatedUser.totp_secret).toBeDefined();
      expect(updatedUser.totp_secret).not.toBeNull();
      expect(updatedUser.updated_at.getTime()).toBeGreaterThan(createdUser.updated_at.getTime());

      const decryptedSecret = encryption.decryptData(updatedUser.totp_secret);
      expect(decryptedSecret).toBe(userTotp.secret.base32);

      const tempTotp = await orchestrator.findTemporaryTotpByUser(createdUser);
      expect(tempTotp).toBeUndefined();
    });

    test('With an empty body', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.patch(`/${createdUser.username}/totp`, {});

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

      const { response, responseBody } = await requestBuilder.patch(`/${createdUser.username}/totp`, {
        totp_token: '12345678',
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

    test('Without an existent TOTP setup', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.patch(`/${createdUser.username}/totp`, {
        totp_token: '123456',
      });

      expect.soft(response.status).toBe(404);
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: `O segredo TOTP não foi encontrado no sistema ou expirou.`,
        action: 'Gere um novo segredo TOTP.',
        error_location_code: 'MODEL:USER_TOTP:FIND_ONE_VALID_BY_USER_ID:NOT_FOUND',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an expired TOTP', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      await orchestrator.createTemporaryTotp(createdUser);
      await orchestrator.expireTemporaryTotp(createdUser);

      const { response, responseBody } = await requestBuilder.patch(`/${createdUser.username}/totp`, {
        totp_token: '123456',
      });

      expect.soft(response.status).toBe(404);
      expect(responseBody).toStrictEqual({
        status_code: 404,
        name: 'NotFoundError',
        message: `O segredo TOTP não foi encontrado no sistema ou expirou.`,
        action: 'Gere um novo segredo TOTP.',
        error_location_code: 'MODEL:USER_TOTP:FIND_ONE_VALID_BY_USER_ID:NOT_FOUND',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('With an invalid token', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const userTotp = await orchestrator.createTemporaryTotp(createdUser);

      const { response, responseBody } = await requestBuilder.patch(`/${createdUser.username}/totp`, {
        totp_token: orchestrator.getInvalidTotpToken(userTotp),
      });

      expect.soft(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: 'O código TOTP informado é inválido.',
        action: 'Verifique o código e tente novamente.',
        error_location_code: `MODEL:USER_TOTP:VALIDATE_TOKEN:INVALID_TOKEN`,
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const tempTotp = await orchestrator.findTemporaryTotpByUser(createdUser);
      expect(tempTotp).toBeDefined();

      const userInDatabase = await user.findOneById(createdUser.id);
      expect(userInDatabase.totp_secret).toBeNull();
    });

    test("Should not update another user's TOTP", async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      await requestBuilder.buildUser();
      await orchestrator.createUser({ username: 'targetUser' });

      const { response, responseBody } = await requestBuilder.patch(`/targetUser/totp`, {
        totp_token: '123456',
      });

      expect.soft(response.status).toBe(403);
      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Não é possível obter ou modificar o TOTP de outro usuário.',
        action: 'Altere o usuário na requisição.',
        error_location_code: 'CONTROLLER:USER_TOTP:VALIDATE_IS_SAME_USER',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('User with TOTP enabled', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const user = await requestBuilder.buildUser();
      const userTotp = await orchestrator.enableTotp(user);

      const { response, responseBody } = await requestBuilder.patch(`/${user.username}/totp`, {
        totp_token: userTotp.generate(),
      });

      expect.soft(response.status).toBe(409);
      expect(responseBody).toStrictEqual({
        status_code: 409,
        name: 'ConflictError',
        message: 'O TOTP já está habilitado.',
        action: 'Se deseja alterar o segredo, desabilite o TOTP primeiro.',
        error_location_code: 'MODEL:USER_TOTP:VALIDATE_TOTP_DISABLED:TOTP_ENABLED',
        error_id: expect.any(String),
        request_id: expect.any(String),
      });

      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);

      const tempTotp = await orchestrator.findTemporaryTotpByUser(user);
      expect(tempTotp).toBeUndefined();
    });
  });
});
