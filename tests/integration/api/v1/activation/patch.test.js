import { version as uuidVersion } from 'uuid';

import activation from 'models/activation.js';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/activation', () => {
  describe('Anonymous user', () => {
    test('Activating with blank body', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('object');
    });

    test('Activating using a null token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: null,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"token_id" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('token_id');
    });

    test('Activating using a malformatted number token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: 10000000,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"token_id" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('token_id');
    });

    test('Activating using an empty string token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: '',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"token_id" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('token_id');
    });

    test('Activating using a malformatted string token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: '10000000',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"token_id" deve possuir um token UUID na versão 4.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('token_id');
    });

    test('Activating using a fresh and valid token', async () => {
      const defaultUser = await orchestrator.createUser();
      const activationToken = await activation.create(defaultUser);

      expect(uuidVersion(activationToken.id)).toBe(4);
      expect(activationToken.user_id).toBe(defaultUser.id);
      expect(activationToken.used).toBe(false);
      expect(Date.parse(activationToken.expires_at)).not.toBeNaN();
      expect(Date.parse(activationToken.created_at)).not.toBeNaN();
      expect(Date.parse(activationToken.updated_at)).not.toBeNaN();
      expect(activationToken.expires_at - activationToken.created_at).toBe(900000); // 15 minutes

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.used).toBe(true);
      expect(Date.parse(activationToken.expires_at)).not.toBeNaN();
      expect(Date.parse(activationToken.created_at)).not.toBeNaN();
      expect(Date.parse(activationToken.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test('Activating using an already used, but valid token', async () => {
      const defaultUser = await orchestrator.createUser();
      const activationToken = await activation.create(defaultUser);

      const firstTryResponde = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const firstTryRespondeBody = await firstTryResponde.json();

      const secondTryResponde = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const secondTryRespondeBody = await secondTryResponde.json();

      expect(secondTryResponde.status).toBe(200);
      expect(uuidVersion(secondTryRespondeBody.id)).toBe(4);
      expect(secondTryRespondeBody.used).toBe(true);
      expect(Date.parse(activationToken.expires_at)).not.toBeNaN();
      expect(Date.parse(activationToken.created_at)).not.toBeNaN();
      expect(Date.parse(activationToken.updated_at)).not.toBeNaN();
      expect(secondTryRespondeBody.updated_at > secondTryRespondeBody.created_at).toBe(true);

      expect(firstTryResponde.status).toBe(secondTryResponde.status);
      expect(firstTryRespondeBody).toStrictEqual(secondTryRespondeBody);
    });

    test('Activating using an expired token', async () => {
      const defaultUser = await orchestrator.createUser();
      const activationToken = await activation.create(defaultUser);
      await activation.update(activationToken.id, {
        expires_at: new Date(Date.now() - 1000),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody.status_code).toBe(404);
      expect(responseBody.name).toBe('NotFoundError');
      expect(responseBody.message).toBe('O token de ativação utilizado não foi encontrado no sistema ou expirou.');
      expect(responseBody.action).toBe('Faça login novamente para receber um novo token por email.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:ACTIVATION:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND');
      expect(responseBody.key).toBe('token_id');
    });
  });

  describe('Default user', () => {
    test('Already active and trying to activate with a valid token (somehow)', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const activationToken = await activation.create(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Você não pode mais ler tokens de ativação.');
      expect(responseBody.action).toBe(
        'Verifique se você já está logado ou tentando ativar novamente o seu ou outro usuário que já está ativo.',
      );
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:ACTIVATION:ACTIVATE_USER_BY_USER_ID:FEATURE_NOT_FOUND');
    });

    test('Already active, logged in and trying to activate with a valid token', async () => {
      let defaultUser = await orchestrator.createUser();
      defaultUser = await orchestrator.activateUser(defaultUser);
      const activationToken = await activation.create(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/activation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          token_id: activationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "read:activation_token".');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });
});
