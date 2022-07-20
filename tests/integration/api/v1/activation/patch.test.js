import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import activation from 'models/activation.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/activation', () => {
  describe('Anonymous user', () => {
    test('Activating with blank body', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Body enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('object');
    });

    test('Activating using a null token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: null,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"token_id" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('token_id');
    });

    test('Activating using a malformatted number token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: 10000000,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"token_id" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('token_id');
    });

    test('Activating using an empty string token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: '',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"token_id" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('token_id');
    });

    test('Activating using a malformatted string token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: '10000000',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"token_id" deve possuir um token UUID na versão 4.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toEqual('token_id');
    });

    test('Activating using a fresh and valid token', async () => {
      const defaultUser = await orchestrator.createUser();
      const activationToken = await activation.create(defaultUser);

      expect(uuidVersion(activationToken.id)).toEqual(4);
      expect(activationToken.user_id).toEqual(defaultUser.id);
      expect(activationToken.used).toEqual(false);
      expect(Date.parse(activationToken.expires_at)).not.toEqual(NaN);
      expect(Date.parse(activationToken.created_at)).not.toEqual(NaN);
      expect(Date.parse(activationToken.updated_at)).not.toEqual(NaN);
      expect(activationToken.expires_at - activationToken.created_at).toBe(900000); // 15 minutes

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.used).toEqual(true);
      expect(Date.parse(activationToken.expires_at)).not.toEqual(NaN);
      expect(Date.parse(activationToken.created_at)).not.toEqual(NaN);
      expect(Date.parse(activationToken.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test('Activating using an already used, but valid token', async () => {
      const defaultUser = await orchestrator.createUser();
      const activationToken = await activation.create(defaultUser);

      const firstTryResponde = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const firstTryRespondeBody = await firstTryResponde.json();

      const secondTryResponde = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const secondTryRespondeBody = await secondTryResponde.json();

      expect(secondTryResponde.status).toEqual(200);
      expect(uuidVersion(secondTryRespondeBody.id)).toEqual(4);
      expect(secondTryRespondeBody.used).toEqual(true);
      expect(Date.parse(activationToken.expires_at)).not.toEqual(NaN);
      expect(Date.parse(activationToken.created_at)).not.toEqual(NaN);
      expect(Date.parse(activationToken.updated_at)).not.toEqual(NaN);
      expect(secondTryRespondeBody.updated_at > secondTryRespondeBody.created_at).toBe(true);

      expect(firstTryResponde.status).toEqual(secondTryResponde.status);
      expect(firstTryRespondeBody).toEqual(secondTryRespondeBody);
    });

    test('Activating using an expired token', async () => {
      const defaultUser = await orchestrator.createUser();
      const activationToken = await activation.create(defaultUser);
      await activation.update(activationToken.id, {
        expires_at: new Date(Date.now() - 1000),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O token de ativação utilizado não foi encontrado no sistema ou expirou.');
      expect(responseBody.action).toEqual('Faça login novamente para receber um novo token por email.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:ACTIVATION:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND');
      expect(responseBody.key).toEqual('token_id');
    });
  });

  describe('Default user', () => {
    test('Already active and trying to activate with a valid token (somehow)', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const activationToken = await activation.create(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não pode mais ler tokens de ativação.');
      expect(responseBody.action).toEqual(
        'Verifique se você já está logado ou tentando ativar novamente o seu ou outro usuário que já está ativo.'
      );
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:ACTIVATION:ACTIVATE_USER_BY_USER_ID:FEATURE_NOT_FOUND');
    });

    test('Already active, logged in and trying to activate with a valid token', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const activationToken = await activation.create(defaultUser);
      let defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "read:activation_token".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });
});
