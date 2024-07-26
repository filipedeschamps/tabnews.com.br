import { version as uuidVersion } from 'uuid';

import session from 'models/session';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/sessions', () => {
  describe('Anonymous User', () => {
    test('Using a valid email and password', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'emailToBeFoundAndAccepted@gmail.com',
        password: 'ValidPassword',
      });

      await orchestrator.activateUser(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailToBeFoundAndAccepted@gmail.com',
          password: 'ValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody.token.length).toBe(96);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const sessionObjectInDatabase = await session.findOneById(responseBody.id);
      expect(sessionObjectInDatabase.user_id).toBe(defaultUser.id);

      const parsedCookiesFromResponse = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromResponse.session_id.name).toBe('session_id');
      expect(parsedCookiesFromResponse.session_id.value).toBe(responseBody.token);
      expect(parsedCookiesFromResponse.session_id.maxAge).toBe(60 * 60 * 24 * 30);
      expect(parsedCookiesFromResponse.session_id.path).toBe('/');
      expect(parsedCookiesFromResponse.session_id.httpOnly).toBe(true);
    });

    test('Using a valid email and password, but user lost the feature "create:session"', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'emailToBeFoundAndLostFeature@gmail.com',
        password: 'ValidPassword',
      });

      await orchestrator.activateUser(defaultUser);
      await orchestrator.removeFeaturesFromUser(defaultUser, ['create:session']);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailToBeFoundAndLostFeature@gmail.com',
          password: 'ValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Você não possui permissão para fazer login.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "create:session".');
      expect(responseBody.status_code).toBe(403);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('CONTROLLER:SESSIONS:POST_HANDLER:CAN_NOT_CREATE_SESSION');
    });

    test('Using a valid email and password, but not activated user', async () => {
      await orchestrator.createUser({
        email: 'emailToBeFoundAndRejected@gmail.com',
        password: 'ValidPassword',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailToBeFoundAndRejected@gmail.com',
          password: 'ValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('O seu usuário ainda não está ativado.');
      expect(responseBody.action).toBe('Verifique seu email, pois acabamos de enviar um novo convite de ativação.');
      expect(responseBody.status_code).toBe(403);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('CONTROLLER:SESSIONS:POST_HANDLER:USER_NOT_ACTIVATED');
    });

    test('Using a valid email and password, but wrong password', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'wrongpassword@gmail.com',
        password: 'wrongpassword',
      });

      await orchestrator.activateUser(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'wrongpassword@gmail.com',
          password: 'IFORGOTMYPASSWORD',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody.name).toBe('UnauthorizedError');
      expect(responseBody.message).toBe('Dados não conferem.');
      expect(responseBody.action).toBe('Verifique se os dados enviados estão corretos.');
      expect(responseBody.status_code).toBe(401);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH');
    });

    test('Using a valid email and password, but wrong email', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'wrongemail@gmail.com',
        password: 'wrongemail',
      });

      await orchestrator.activateUser(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'IFORGOTMYEMAIL@gmail.com',
          password: 'wrongemail',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody.name).toBe('UnauthorizedError');
      expect(responseBody.message).toBe('Dados não conferem.');
      expect(responseBody.action).toBe('Verifique se os dados enviados estão corretos.');
      expect(responseBody.status_code).toBe(401);
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH');
    });

    test('Using a valid password, but without email', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'validPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('Using a valid password, but empty email', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          password: 'validPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('Using a valid password, but email using number type', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 12345,
          password: 'validPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('Using a valid password, but invalid email', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalidemail',
          password: 'validPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"email" deve conter um email válido.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('email');
    });

    test('Using a valid email, but without password', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ValidEmail@gmail.com',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('Using a valid email, but empty password', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ValidEmail@gmail.com',
          password: '',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('Using a valid email, but small password', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ValidEmail@gmail.com',
          password: 'small',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" deve conter no mínimo 8 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('Using a valid email, but too long password', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ValidEmail@gmail.com',
          password: '73characterssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" deve conter no máximo 72 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('Using a valid email, but number type password', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ValidEmail@gmail.com',
          password: 12345678,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"password" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('Sending a blank body', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
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
  });
});
