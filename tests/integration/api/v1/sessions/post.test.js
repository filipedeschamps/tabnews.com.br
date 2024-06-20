import { version as uuidVersion } from 'uuid';

import session from 'models/session';
import totp from 'models/totp';
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
      expect(responseBody.token.length).toEqual(96);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.expires_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);

      const sessionObjectInDatabase = await session.findOneById(responseBody.id);
      expect(sessionObjectInDatabase.user_id).toEqual(defaultUser.id);

      const parsedCookiesFromResponse = orchestrator.parseSetCookies(response);
      expect(parsedCookiesFromResponse.session_id.name).toEqual('session_id');
      expect(parsedCookiesFromResponse.session_id.value).toEqual(responseBody.token);
      expect(parsedCookiesFromResponse.session_id.maxAge).toEqual(60 * 60 * 24 * 30);
      expect(parsedCookiesFromResponse.session_id.path).toEqual('/');
      expect(parsedCookiesFromResponse.session_id.httpOnly).toEqual(true);
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
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para fazer login.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "create:session".');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:SESSIONS:POST_HANDLER:CAN_NOT_CREATE_SESSION');
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
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('O seu usuário ainda não está ativado.');
      expect(responseBody.action).toEqual('Verifique seu email, pois acabamos de enviar um novo convite de ativação.');
      expect(responseBody.status_code).toEqual(403);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:SESSIONS:POST_HANDLER:USER_NOT_ACTIVATED');
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
      expect(responseBody.name).toEqual('UnauthorizedError');
      expect(responseBody.message).toEqual('Dados não conferem.');
      expect(responseBody.action).toEqual('Verifique se os dados enviados estão corretos.');
      expect(responseBody.status_code).toEqual(401);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH');
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
      expect(responseBody.name).toEqual('UnauthorizedError');
      expect(responseBody.message).toEqual('Dados não conferem.');
      expect(responseBody.action).toEqual('Verifique se os dados enviados estão corretos.');
      expect(responseBody.status_code).toEqual(401);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH');
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"email" deve conter um email válido.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve conter no mínimo 8 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve conter no máximo 72 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"password" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('password');
    });

    test('Sending a blank body', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
      expect(responseBody.key).toBe('object');
    });

    test('Using a valid email and password with totp enabled but not sending token', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'emailUsingTOTP@gmail.com',
        password: 'ValidPassword',
      });

      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const secret = totp.createSecret();

      await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/enable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_secret: secret,
        }),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailUsingTOTP@gmail.com',
          password: 'ValidPassword',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(202);
      expect(responseBody.status_code).toEqual(202);
      expect(responseBody.message).toEqual('Duplo fator de autenticação necessário');
      expect(responseBody.action).toEqual('Envie o token do duplo fator de autenticação');
    });

    test('Using a valid email and password with totp enabled and sending a valid token', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'emailSendingValidTOTP@gmail.com',
        password: 'ValidPassword',
      });

      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const secret = totp.createSecret();
      const token = totp.createTOTP(secret).generate();

      await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/enable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_secret: secret,
        }),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailSendingValidTOTP@gmail.com',
          password: 'ValidPassword',
          totp_token: token,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody.token.length).toEqual(96);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.expires_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);

      const sessionObjectInDatabase = await session.findOneById(responseBody.id);
      expect(sessionObjectInDatabase.user_id).toEqual(defaultUser.id);

      const parsedCookiesFromResponse = authentication.parseSetCookies(response);
      expect(parsedCookiesFromResponse.session_id.name).toEqual('session_id');
      expect(parsedCookiesFromResponse.session_id.value).toEqual(responseBody.token);
      expect(parsedCookiesFromResponse.session_id.maxAge).toEqual(60 * 60 * 24 * 30);
      expect(parsedCookiesFromResponse.session_id.path).toEqual('/');
      expect(parsedCookiesFromResponse.session_id.httpOnly).toEqual(true);
    });

    test('Using a valid email and password with totp enabled and sending a invalid token', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'emailSendingInvalidTOTP@gmail.com',
        password: 'ValidPassword',
      });

      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);
      const secret = totp.createSecret();
      const invalidToken = totp.createTOTP(totp.createSecret()).generate();

      await fetch(`${orchestrator.webserverUrl}/api/v1/mfa/totp/enable`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },
        body: JSON.stringify({
          totp_secret: secret,
        }),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailSendingInvalidTOTP@gmail.com',
          password: 'ValidPassword',
          totp_token: invalidToken,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody.name).toEqual('UnauthorizedError');
      expect(responseBody.message).toEqual('Código informado inválido');
      expect(responseBody.action).toEqual('Verifique se os dados enviados estão corretos');
      expect(responseBody.status_code).toEqual(401);
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:SESSIONS:POST_HANDLER:TOTP_TOKEN_INVALID');
    });
  });
});
