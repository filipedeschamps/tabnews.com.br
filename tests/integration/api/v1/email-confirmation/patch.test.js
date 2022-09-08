import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';
import user from 'models/user.js';
import emailConfirmation from 'models/email-confirmation.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe('PATCH /api/v1/email-confirmation', () => {
  describe('Anonymous user', () => {
    test('With blank body', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Body enviado deve ser do tipo Object.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'object',
        type: 'object.base',
      });
    });

    test('With a null token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: null,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

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

    test('With a malformatted number token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: 10000000,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

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

    test('With an empty string token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: '',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: '"token_id" não pode estar em branco.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        key: 'token_id',
        type: 'string.empty',
      });
    });

    test('With a malformatted string token', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: '10000000',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

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
    });

    test('With a fresh and valid token', async () => {
      // 1) UPDATE USER EMAIL
      const defaultUser = await orchestrator.createUser({
        email: 'fresh.valid.token@email.com',
      });
      await orchestrator.activateUser(defaultUser);
      const defaultUserSession = await orchestrator.createSession(defaultUser);

      const updateUserResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${defaultUserSession.token}`,
        },

        body: JSON.stringify({
          email: 'new@email.com',
        }),
      });

      expect(updateUserResponse.status).toEqual(200);

      // Attention: it should not update the email in the database
      // before the user clicks on the confirmation link sent to the new email.
      // See `/tests/integration/email-confirmation` for more details.
      const userInDatabaseCheck1 = await user.findOneById(defaultUser.id);
      expect(userInDatabaseCheck1.email).toEqual('fresh.valid.token@email.com');

      // 2) RECEIVE CONFIRMATION EMAIL
      const confirmationEmail = await orchestrator.getLastEmail();

      const tokenObjectInDatabase = await emailConfirmation.findOneTokenByUserId(defaultUser.id);
      const emailConfirmationPageEndpoint = emailConfirmation.getEmailConfirmationPageEndpoint(
        tokenObjectInDatabase.id
      );

      expect(confirmationEmail.sender).toEqual('<contato@tabnews.com.br>');
      expect(confirmationEmail.recipients).toEqual(['<new@email.com>']);
      expect(confirmationEmail.subject).toEqual('Confirme seu novo email');
      expect(confirmationEmail.text.includes(defaultUser.username)).toBe(true);
      expect(confirmationEmail.text.includes('uma alteração de email foi solicitada')).toBe(true);
      expect(confirmationEmail.text.includes(emailConfirmationPageEndpoint)).toBe(true);

      // 3) USE CONFIRMATION TOKEN
      const emailConfirmationResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: tokenObjectInDatabase.id,
        }),
      });

      const emailConfirmationResponseBody = await emailConfirmationResponse.json();

      expect(emailConfirmationResponse.status).toEqual(200);

      expect(emailConfirmationResponseBody).toStrictEqual({
        id: emailConfirmationResponseBody.id,
        used: true,
        expires_at: tokenObjectInDatabase.expires_at.toISOString(),
        created_at: tokenObjectInDatabase.created_at.toISOString(),
        updated_at: emailConfirmationResponseBody.updated_at,
      });

      expect(uuidVersion(emailConfirmationResponseBody.id)).toEqual(4);
      expect(emailConfirmationResponseBody.updated_at > tokenObjectInDatabase.updated_at.toISOString()).toBe(true);

      // 4) CHECK IF EMAIL WAS UPDATED
      const userInDatabaseCheck2 = await user.findOneById(defaultUser.id);
      expect(userInDatabaseCheck2.email).toEqual('new@email.com');
    });

    test('With an already used, but valid token', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'already.used.token@email.com',
      });

      const emailConfirmationToken = await emailConfirmation.create(defaultUser.id, 'idempotent@patch.com');

      const firstTryResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: emailConfirmationToken.id,
        }),
      });

      const userInDatabase = await user.findOneById(defaultUser.id);
      expect(userInDatabase.email).toEqual('idempotent@patch.com');

      const firstTryResponseBody = await firstTryResponse.json();

      const secondTryResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: emailConfirmationToken.id,
        }),
      });

      const secondTryResponseBody = await secondTryResponse.json();

      expect(secondTryResponse.status).toEqual(200);

      expect(secondTryResponseBody).toStrictEqual({
        id: emailConfirmationToken.id,
        used: true,
        expires_at: emailConfirmationToken.expires_at.toISOString(),
        created_at: emailConfirmationToken.created_at.toISOString(),
        updated_at: secondTryResponseBody.updated_at,
      });

      expect(secondTryResponseBody.updated_at > emailConfirmationToken.updated_at.toISOString()).toBe(true);

      expect(firstTryResponse.status).toEqual(secondTryResponse.status);
      expect(firstTryResponseBody).toEqual(secondTryResponseBody);
    });

    test('With an already used email (before creating the token)', async () => {
      const firstUser = await orchestrator.createUser({
        email: 'validation.error@before.com',
      });
      await orchestrator.activateUser(firstUser);
      const firstUserSession = await orchestrator.createSession(firstUser);

      const secondUser = await orchestrator.createUser({
        email: 'other.user.email@before.com',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
        method: 'patch',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSession.token}`,
        },

        body: JSON.stringify({
          email: 'other.user.email@before.com',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O email informado já está sendo usado.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:USER:VALIDATE_UNIQUE_EMAIL:ALREADY_EXISTS',
        key: 'email',
      });

      const userInDatabaseCheck1 = await user.findOneById(firstUser.id);
      expect(userInDatabaseCheck1.email).toEqual('validation.error@before.com');
    });

    test('With an already used email (after creating the token)', async () => {
      const firstUser = await orchestrator.createUser({
        email: 'validation.error@after.com',
      });

      const emailConfirmationToken = await emailConfirmation.create(firstUser.id, 'other.user.email@after.com');

      const secondUser = await orchestrator.createUser({
        email: 'other.user.email@after.com',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: emailConfirmationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O email informado já está sendo usado.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:USER:VALIDATE_UNIQUE_EMAIL:ALREADY_EXISTS',
        key: 'email',
      });

      const userInDatabaseCheck1 = await user.findOneById(firstUser.id);
      expect(userInDatabaseCheck1.email).toEqual('validation.error@after.com');
    });

    test('With an expired token', async () => {
      const defaultUser = await orchestrator.createUser({
        email: 'expired.token@email.com',
      });

      const emailConfirmationToken = await emailConfirmation.create(
        defaultUser.id,
        'expired.token.will.reject@email.com'
      );

      await emailConfirmation.update(emailConfirmationToken.id, {
        expires_at: new Date(Date.now() - 1000),
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          token_id: emailConfirmationToken.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O token de confirmação de email utilizado não foi encontrado no sistema ou expirou.',
        action: 'Solicite uma nova alteração de email.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:EMAIL_CONFIRMATION:FIND_ONE_VALID_TOKEN_BY_ID:NOT_FOUND',
        key: 'token_id',
      });

      const userInDatabaseCheck1 = await user.findOneById(defaultUser.id);
      expect(userInDatabaseCheck1.email).toEqual('expired.token@email.com');
    });
  });
});
