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

describe('POST /api/v1/users/[username]/totp', () => {
  describe('Anonymous user', () => {
    test('With a non-existent user', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');

      const { response, responseBody } = await requestBuilder.post(`/userDoesNotExist/totp`);

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

      const { response, responseBody } = await requestBuilder.post(`/anotherUser/totp`);

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
    test("Get user's own TOTP URL", async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const { response, responseBody } = await requestBuilder.post(`/${createdUser.username}/totp`);

      expect.soft(response.status).toBe(201);

      const searchParams = new URL(responseBody.totp_url).searchParams;
      const plainSecret = searchParams.get('secret');

      expect(plainSecret).toHaveLength(32);
      expect(responseBody).toStrictEqual({
        totp_url: `otpauth://totp/TabNews:${createdUser.username}?issuer=TabNews&secret=${plainSecret}&algorithm=SHA1&digits=6&period=30`,
      });

      const tempTotp = await orchestrator.findTemporaryTotpByUser(createdUser);
      expect(tempTotp).toStrictEqual({
        user_id: createdUser.id,
        totp_secret: expect.any(String),
        expires_at: expect.any(Date),
        created_at: expect.any(Date),
      });

      const userAfter = await user.findOneById(createdUser.id);
      expect(userAfter).toStrictEqual(createdUser);

      const decryptedSecretFromDb = encryption.decryptData(tempTotp.totp_secret);
      expect(decryptedSecretFromDb).toBe(plainSecret);
      expect(tempTotp.totp_secret).not.toBe(plainSecret);
    });

    test("Get user's own TOTP URL twice", async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const createdUser = await requestBuilder.buildUser();

      const { response: response1, responseBody: responseBody1 } = await requestBuilder.post(
        `/${createdUser.username}/totp`,
      );
      expect.soft(response1.status).toBe(201);
      const searchParams1 = new URL(responseBody1.totp_url).searchParams;
      const plainSecret1 = searchParams1.get('secret');

      const { response: response2, responseBody: responseBody2 } = await requestBuilder.post(
        `/${createdUser.username}/totp`,
      );
      expect.soft(response2.status).toBe(201);
      const searchParams2 = new URL(responseBody2.totp_url).searchParams;
      const plainSecret2 = searchParams2.get('secret');

      expect(plainSecret1).not.toBe(plainSecret2);
      expect(plainSecret1).toHaveLength(32);
      expect(plainSecret2).toHaveLength(32);

      const tempTotp = await orchestrator.findTemporaryTotpByUser(createdUser);
      expect(tempTotp).toBeDefined();

      const decryptedSecretFromDb = encryption.decryptData(tempTotp.totp_secret);

      expect(decryptedSecretFromDb).toBe(plainSecret2);
      expect(decryptedSecretFromDb).not.toBe(plainSecret1);
    });

    test("Should not get another user's TOTP URL", async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      await requestBuilder.buildUser();
      const targetUser = await orchestrator.createUser({ username: 'targetUser' });

      const { response, responseBody } = await requestBuilder.post(`/targetUser/totp`);

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

      const tempTotp = await orchestrator.findTemporaryTotpByUser(targetUser);
      expect(tempTotp).toBeUndefined();
    });

    test('User with TOTP enabled', async () => {
      const requestBuilder = new RequestBuilder('/api/v1/users');
      const user = await requestBuilder.buildUser();
      await orchestrator.enableTotp(user);

      const { response, responseBody } = await requestBuilder.post(`/${user.username}/totp`);

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
