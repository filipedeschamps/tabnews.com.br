import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/contents/[username]/[slug]', () => {
  describe('Anonymous user', () => {
    test('Content with minimum valid data', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/someUsername/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Anônimo tentando atualizar um conteúdo existente',
          body: 'Não deveria conseguir.',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "update:content".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User without "update:content" feature', () => {
    test('"root" content with valid data', async () => {
      const userWithoutFeature = await orchestrator.createUser();
      await orchestrator.activateUser(userWithoutFeature);
      await orchestrator.removeFeaturesFromUser(userWithoutFeature, ['update:content']);
      const sessionObject = await orchestrator.createSession(userWithoutFeature);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${userWithoutFeature.username}/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Usuário válido, tentando atualizar conteúdo na raiz do site.',
          body: 'Não deveria conseguir, pois não possui a feature "update:content".',
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "update:content".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });

    test('"child" content with valid data', async () => {
      const userWithoutFeature = await orchestrator.createUser();
      await orchestrator.activateUser(userWithoutFeature);
      await orchestrator.removeFeaturesFromUser(userWithoutFeature, ['update:content']);
      const sessionObject = await orchestrator.createSession(userWithoutFeature);

      const rootContent = await orchestrator.createContent({
        owner_id: userWithoutFeature.id,
        title: 'Root content title',
        body: 'Root content body',
      });

      const childContent = await orchestrator.createContent({
        owner_id: userWithoutFeature.id,
        title: 'Child content title',
        body: 'Child content body',
        parent_id: rootContent.id,
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${userWithoutFeature.username}/${childContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Usuário válido, tentando atualizar conteúdo "child".',
            body: 'Não deveria conseguir, pois não possui a feature "update:content".',
          }),
        }
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "update:content".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('Default user', () => {
    test('Content without PATCH Body and "Content-Type"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents//${defaultUser.username}/slug`, {
        method: 'PATCH',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
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
    });

    test('Content with PATCH Body containing an invalid JSON string', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/slug`, {
        method: 'PATCH',
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
        body: 'Texto corrido no lugar de um JSON',
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
    });

    test('Content with PATCH Body containing an empty Object', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Objeto enviado deve ter no mínimo uma chave.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with invalid "username" in the URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/invalid-username/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({}),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"username" deve conter apenas caracteres alfanuméricos.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with invalid "slug" in the URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/%3Cscript%3Ealert%28%29%3Cscript%3E`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"slug" está no formato errado.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "username" non-existent', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSessionObject = await orchestrator.createSession(firstUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/ThisUserDoesNotExists/slug`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Primeiro usuário tentando atualizar o conteúdo do Segundo usuário',
          body: 'Não deveria conseguir',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O "username" informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "username" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
    });

    test('Content with "username" existent, but "slug" non-existent', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSessionObject = await orchestrator.createSession(firstUser);

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Conteúdo do primeiro usuário',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/esse-slug-nao-existe`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Tentando atualizar um conteúdo próprio, mas errando o slug',
            body: 'Não deveria conseguir',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(404);
      expect(responseBody.status_code).toEqual(404);
      expect(responseBody.name).toEqual('NotFoundError');
      expect(responseBody.message).toEqual('O conteúdo informado não foi encontrado no sistema.');
      expect(responseBody.action).toEqual('Verifique se o "slug" está digitado corretamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('CONTROLLER:CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND');
    });

    test('Content with "username" and "slug" pointing to content from another user', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSessionObject = await orchestrator.createSession(firstUser);

      const secondUser = await orchestrator.createUser();

      const secondUserContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo do segundo usuário',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Primeiro usuário tentando atualizar o conteúdo do Segundo usuário',
            body: 'Não deveria conseguir',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para atualizar o conteúdo de outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "update:content:others".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual(
        'CONTROLLER:CONTENTS:PATCH:USER_CANT_UPDATE_CONTENT_FROM_OTHER_USER'
      );
    });

    test('Content with "owner_id" pointing to another user', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSessionObject = await orchestrator.createSession(firstUser);
      const secondUser = await orchestrator.createUser();

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Conteúdo do Primeiro Usuário antes do patch!',
        body: 'Body antes do patch!',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${firstUser.username}/${firstUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Tentando atualizar o dono do conteúdo.',
            body: 'Campo "owner_id" da request deveria ser ignorado e pego através da sessão.',
            owner_id: secondUser.id,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: firstUserContent.id,
        owner_id: firstUser.id,
        parent_id: null,
        slug: 'conteudo-do-primeiro-usuario-antes-do-patch',
        title: 'Tentando atualizar o dono do conteúdo.',
        body: 'Campo "owner_id" da request deveria ser ignorado e pego através da sessão.',
        status: 'published',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 1,
        owner_username: firstUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(firstUserContent.published_at.toISOString());
      expect(responseBody.updated_at > firstUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "body" declared solely', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Body novo',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body novo',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "body" containing blank String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: '',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing empty Markdown', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: `![](https://image-url.com/image.png)
            <div><a></a></div>`,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Markdown deve conter algum texto');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title", "body" and "source_url" containing \\u0000 null characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Contendo caractere \u0000 proibido no Postgres',
        body: '\u0000Começando com caractere proibido no Postgres',
        source_url: 'https://\u0000teste-caractere.invalido/',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: '\u0000Começando com caractere proibido no Postgres',
            body: 'Terminando com caractere proibido no Postgres\u0000',
            source_url: 'https://teste-caractere.invalido/\u0000',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'contendo-caractere-proibido-no-postgres',
        title: 'Começando com caractere proibido no Postgres',
        body: 'Terminando com caractere proibido no Postgres',
        status: 'draft',
        source_url: 'https://teste-caractere.invalido/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
    });

    test('Content with "title" and "body" containing invalid characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: '\u2800Título começando com caracteres inválidos.',
        body: 'Texto começando com caracteres inválidos.',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Título terminando com caracteres inválidos.\u200f',
            body: '\u2800Texto terminando com caracteres inválidos.\u200e',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" deve começar com caracteres visíveis.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing more than 20.000 characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'A'.repeat(20001),
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" deve conter no máximo 20000 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing untrimmed values', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: ' Espaço no início e no fim ',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" deve começar com caracteres visíveis.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" ending with untrimmed values', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Espaço só no fim ',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Espaço só no fim',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "body" containing Null value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: null,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" possui o valor inválido "null".');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" declared solely', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        slug: 'slug-velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: 'slug-novo',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'slug-novo',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "slug" containing the same value of another content (same user, both "published" status)', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const firstContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo',
        body: 'Primeiro conteúdo',
        slug: 'primeiro-conteudo',
        status: 'published',
      });

      const secondContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo',
        body: 'Segundo conteúdo',
        slug: 'segundo-conteudo',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${secondContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: 'primeiro-conteudo',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" diferente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Content with "slug" containing the same value of another content (same user, one with "draft" and the other "published" status)', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const firstContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo',
        body: 'Primeiro conteúdo',
        slug: 'primeiro-conteudo',
        status: 'draft',
      });

      const secondContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo',
        body: 'Segundo conteúdo',
        slug: 'segundo-conteudo',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${secondContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: 'primeiro-conteudo',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" diferente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Content with "slug" containing the same value of another content (same user, one with "published" and the other "deleted" status)', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const firstContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo',
        body: 'Primeiro conteúdo',
        slug: 'primeiro-conteudo',
        status: 'published',
      });

      await orchestrator.updateContent(firstContent.id, {
        status: 'deleted',
      });

      const secondContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo',
        body: 'Segundo conteúdo',
        slug: 'segundo-conteudo',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${secondContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: 'primeiro-conteudo',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'primeiro-conteudo',
        title: 'Segundo conteúdo',
        body: 'Segundo conteúdo',
        status: 'published',
        tabcoins: 1,
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        owner_username: defaultUser.username,
      });

      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
    });

    test('Content with "slug" containing a blank String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: '',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"slug" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing more than 255 bytes', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: 'this-slug-must-be-changed-to-255-bytesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'this-slug-must-be-changed-to-255-bytessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "slug" containing special characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: 'slug-não-pode-ter-caracteres-especiais',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"slug" está no formato errado.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing Null value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            slug: null,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"slug" possui o valor inválido "null".');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title" declared solely', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Título novo',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título novo',
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "title" containing a blank String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: '',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"title" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title", but current content is "deleted"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      await orchestrator.updateContent(defaultUserContent.id, {
        status: 'deleted',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Título novo',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(404);

      expect(responseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        status_code: 404,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Content with "title" containing more than 255 characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title:
              'Este título possui 256 caracteressssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"title" deve conter no máximo 255 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title" containing Null value in "root" content', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: null,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"title" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE');
    });

    test('Content with "title" containing Null value in "child" content', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root old title',
        body: 'Root old body',
      });

      const childContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        title: 'Child old title',
        body: 'Child old body',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: null,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: childContent.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: 'child-old-title',
        title: null,
        body: 'Child old body',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > childContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "title" containing untrimmed values', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: ' Título válido, mas com espaços em branco no início e no fim ',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título válido, mas com espaços em branco no início e no fim',
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "title" containing unescaped characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\o/'`,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\o/'`,
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "draft" set to "draft"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'draft',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "draft" set to "published"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'published',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'published',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 1,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "published" set to "draft"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'draft',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 1,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "published" set to "draft", than "published"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const originalContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        status: 'published',
      });

      const draftResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${originalContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'draft',
          }),
        }
      );

      const draftResponseBody = await draftResponse.json();

      const republishedResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${originalContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'published',
          }),
        }
      );

      const republishedResponseBody = await republishedResponse.json();

      expect(republishedResponse.status).toEqual(200);

      expect(republishedResponseBody).toStrictEqual({
        id: republishedResponseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'published',
        source_url: null,
        created_at: republishedResponseBody.created_at,
        updated_at: republishedResponseBody.updated_at,
        published_at: republishedResponseBody.published_at,
        deleted_at: null,
        tabcoins: 1,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(republishedResponseBody.id)).toEqual(4);
      expect(Date.parse(republishedResponseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(republishedResponseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(republishedResponseBody.published_at)).not.toEqual(NaN);
      expect(draftResponseBody.published_at).toEqual(originalContent.published_at.toISOString());
      expect(draftResponseBody.published_at).toEqual(republishedResponseBody.published_at);
      expect(draftResponseBody.updated_at > originalContent.updated_at.toISOString()).toEqual(true);
      expect(republishedResponseBody.updated_at > draftResponseBody.updated_at).toEqual(true);
    });

    test('Content with "status" "published" set to "deleted"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Title',
        body: 'Body',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'deleted',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'title',
        title: 'Title',
        body: 'Body',
        status: 'deleted',
        tabcoins: 1,
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: responseBody.deleted_at,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidVersion(responseBody.owner_id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.deleted_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
      expect(responseBody.deleted_at > defaultUserContent.published_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "published" set to "deleted", than "published"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const originalContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Title',
        body: 'Body',
        status: 'published',
      });

      await fetch(`${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${originalContent.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          status: 'deleted',
        }),
      });

      const republishedResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${originalContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'published',
          }),
        }
      );

      const republishedResponseBody = await republishedResponse.json();

      expect(republishedResponse.status).toEqual(404);
      expect(republishedResponseBody).toStrictEqual({
        name: 'NotFoundError',
        message: 'O conteúdo informado não foi encontrado no sistema.',
        action: 'Verifique se o "slug" está digitado corretamente.',
        status_code: 404,
        error_id: republishedResponseBody.error_id,
        request_id: republishedResponseBody.request_id,
        error_location_code: 'CONTROLLER:CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND',
        key: 'slug',
      });
      expect(uuidVersion(republishedResponseBody.error_id)).toEqual(4);
      expect(uuidVersion(republishedResponseBody.request_id)).toEqual(4);
    });

    test('Content with "status" set to "non_existent_status"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: 'inexisting_status',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"status" deve possuir um dos seguintes valores: "draft", "published" ou "deleted".'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "status" set to Null', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: null,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"status" deve possuir um dos seguintes valores: "draft", "published" ou "deleted".'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "status" set a blank String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: '',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"status" deve possuir um dos seguintes valores: "draft", "published" ou "deleted".'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a valid HTTP URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'http://www.tabnews.com.br/',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: 'http://www.tabnews.com.br/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a valid HTTPS URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'https://www.tabnews.com.br/museu',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: 'https://www.tabnews.com.br/museu',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a valid long TLD', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar um baita de um Top-Level Domain',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'https://nic.xn--vermgensberatung-pwb/',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'alterar-um-baita-de-um-top-level-domain',
        title: 'Alterar um baita de um Top-Level Domain',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
        status: 'draft',
        source_url: 'https://nic.xn--vermgensberatung-pwb/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a valid short URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar URL bem curta',
        body: 'Por exemplo o encurtador do Telegram',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'https://t.me',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'alterar-url-bem-curta',
        title: 'Alterar URL bem curta',
        body: 'Por exemplo o encurtador do Telegram',
        status: 'draft',
        source_url: 'https://t.me',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a invalid short TLD', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar um Top-Level Domain menor que o permitido',
        body: 'TLDs precisam ter pelo menos dois caracteres',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'http://invalidtl.d',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a invalid long TLD', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar um Top-Level Domain maior que o permitido',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'https://tl.dcomvinteecincocaracteres',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a not accepted Protocol', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'ftp://www.tabnews.com.br',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" not containing a protocol', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'www.tabnews.com.br',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing an incomplete URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'https://lol.',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing query parameters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=old',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=old',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing fragment component', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: 'https://www.tabnews.com.br/#:~:text=TabNews,-Status',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: 'https://www.tabnews.com.br/#:~:text=TabNews,-Status',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing an empty String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: '',
          }),
        }
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"source_url" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a Null value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        source_url: 'https://www.tabnews.com.br',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            source_url: null,
          }),
        }
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "parent_id" declared solely', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content title',
        body: 'Root content body',
      });

      const childContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Child content title',
        body: 'Child content body',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            parent_id: rootContent.id,
          }),
        }
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: 'child-content-title',
        title: 'Child content title',
        body: 'Child content body',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > childContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "title" and "parent_id" set to Null', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content title',
        body: 'Root content body',
      });

      const childContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Child content title',
        body: 'Child content body',
        parent_id: rootContent.id,
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            parent_id: null,
          }),
        }
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'child-content-title',
        title: 'Child content title',
        body: 'Child content body',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > childContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content without "title" and "parent_id" set to Null', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content title',
        body: 'Root content body',
      });

      const childContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Child content title',
        body: 'Child content body',
        parent_id: rootContent.id,
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: null,
            parent_id: null,
          }),
        }
      );
      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"title" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE');
    });

    test('Content with "parent_id" set to itself', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content title',
        body: 'Root content body',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${rootContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            parent_id: rootContent.id,
          }),
        }
      );
      const responseBody = await response.json();

      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"parent_id" não deve apontar para o próprio conteúdo.');
      expect(responseBody.action).toEqual('Utilize um "parent_id" diferente do "id" do mesmo conteúdo.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:CONTENT:CHECK_FOR_PARENT_ID_RECURSION:RECURSION_FOUND');
    });

    test('Content with "parent_id" containing a Number', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            parent_id: 123456,
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"parent_id" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "parent_id" containing a blank string', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            parent_id: '',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"parent_id" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "parent_id" containing a malformatted UUIDV4', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            parent_id: 'isso não é um UUID válido',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"parent_id" deve possuir um token UUID na versão 4.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "parent_id" that does not exists', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            parent_id: 'fe2e20f5-9296-45ea-9a0f-401866819b9e',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        'Você está tentando criar ou atualizar um sub-conteúdo para um conteúdo que não existe.'
      );
      expect(responseBody.action).toEqual('Utilize um "parent_id" que aponte para um conteúdo que existe.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND');
    });

    test('Content from another user', async () => {
      const firstUser = await orchestrator.createUser();
      const secondUser = await orchestrator.createUser();

      await orchestrator.activateUser(firstUser);
      const firstUserSessionObject = await orchestrator.createSession(firstUser);
      const secondUserContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo do Segundo Usuário antes do patch!',
        body: 'Body antes do patch!',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Tentando atualizar o conteúdo.',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para atualizar o conteúdo de outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "update:content:others".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual(
        'CONTROLLER:CONTENTS:PATCH:USER_CANT_UPDATE_CONTENT_FROM_OTHER_USER'
      );
    });
  });

  describe('User with "update:content:others" feature', () => {
    test('Content from another user', async () => {
      const privilegedUser = await orchestrator.createUser();
      await orchestrator.addFeaturesToUser(privilegedUser, ['update:content:others']);
      await orchestrator.activateUser(privilegedUser);
      const privilegedUserSessionObject = await orchestrator.createSession(privilegedUser);

      const secondUser = await orchestrator.createUser();
      const secondUserContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo do Segundo Usuário antes do patch!',
        body: 'Body antes do patch!',
        status: 'published',
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${secondUserContent.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${privilegedUserSessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Novo title.',
            body: 'Novo body.',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: secondUserContent.id,
        owner_id: secondUser.id,
        parent_id: null,
        slug: 'conteudo-do-segundo-usuario-antes-do-patch',
        title: 'Novo title.',
        body: 'Novo body.',
        status: 'published',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 1,
        owner_username: secondUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(secondUserContent.published_at.toISOString());
      expect(responseBody.updated_at > secondUserContent.updated_at.toISOString()).toEqual(true);
    });

    describe('TabCoins', () => {
      test('"root" content updated from "draft" to "draft" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'draft',
        });

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'draft',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "draft" to "published" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'draft',
        });

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'published',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(1);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(2);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "draft" to "deleted" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'draft',
        });

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "published" to "deleted" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'published',
        });

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(1);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content with positive tabcoins updated from "published" to "deleted" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'published',
        });

        await orchestrator.createBalance({
          balanceType: 'content:tabcoin',
          recipientId: defaultUserContent.id,
          amount: 10,
        });

        await orchestrator.createBalance({
          balanceType: 'user:tabcoin',
          recipientId: defaultUser.id,
          amount: 10,
        });

        const contentFirstGetResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`
        );
        const contentFirstGetResponseBody = await contentFirstGetResponse.json();
        expect(contentFirstGetResponseBody.tabcoins).toEqual(11);

        const userFirstGetResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`);
        const userFirstGetResponseBody = await userFirstGetResponse.json();
        expect(userFirstGetResponseBody.tabcoins).toEqual(12);

        const contentSecondResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${defaultUserSession.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentSecondResponseBody = await contentSecondResponse.json();

        expect(contentSecondResponseBody.tabcoins).toEqual(11);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content with negative tabcoins updated from "published" to "deleted" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const defaultUserSession = await orchestrator.createSession(defaultUser);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'published',
        });

        await orchestrator.createBalance({
          balanceType: 'content:tabcoin',
          recipientId: defaultUserContent.id,
          amount: -10,
        });

        await orchestrator.createBalance({
          balanceType: 'user:tabcoin',
          recipientId: defaultUser.id,
          amount: -10,
        });

        const contentFirstGetResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`
        );
        const contentFirstGetResponseBody = await contentFirstGetResponse.json();
        expect(contentFirstGetResponseBody.tabcoins).toEqual(-9);

        const userFirstGetResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`);
        const userFirstGetResponseBody = await userFirstGetResponse.json();
        expect(userFirstGetResponseBody.tabcoins).toEqual(-8);

        const contentSecondResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${defaultUserSession.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentSecondResponseBody = await contentSecondResponse.json();

        expect(contentSecondResponseBody.tabcoins).toEqual(-9);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(-10);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "published" to "draft", and then "published" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'published',
        });

        const draftContentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'draft',
            }),
          }
        );

        const draftContentResponseBody = await draftContentResponse.json();

        expect(draftContentResponseBody.tabcoins).toEqual(1);

        const userResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse1Body = await userResponse1.json();

        expect(userResponse1Body.tabcoins).toEqual(2);
        expect(userResponse1Body.tabcash).toEqual(0);

        const publishedContentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${defaultUserContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'published',
            }),
          }
        );

        const publishedContentResponseBody = await publishedContentResponse.json();

        expect(publishedContentResponseBody.tabcoins).toEqual(1);

        const userResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse2Body = await userResponse2.json();

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "draft" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body',
          status: 'published',
        });

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'draft',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(2);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "published" status (same user)', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body',
          status: 'draft',
        });

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'published',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(2);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "published" status (different user)', async () => {
        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(secondUser);
        const sessionObject = await orchestrator.createSession(secondUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body',
          status: 'draft',
        });

        const userResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse1Body = await userResponse1.json();

        expect(userResponse1Body.tabcoins).toEqual(0);
        expect(userResponse1Body.tabcash).toEqual(0);

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'published',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(1);

        const userResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse2Body = await userResponse2.json();

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "deleted" status (same user)', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body',
          status: 'draft',
        });

        const userResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse1Body = await userResponse1.json();

        expect(userResponse1Body.tabcoins).toEqual(2);
        expect(userResponse1Body.tabcash).toEqual(0);

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse2Body = await userResponse2.json();

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "deleted" status (different user)', async () => {
        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(secondUser);
        const sessionObject = await orchestrator.createSession(secondUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body',
          status: 'draft',
        });

        const userResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse1Body = await userResponse1.json();

        expect(userResponse1Body.tabcoins).toEqual(0);
        expect(userResponse1Body.tabcash).toEqual(0);

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse2Body = await userResponse2.json();

        expect(userResponse2Body.tabcoins).toEqual(0);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "deleted" status (same user)', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body',
          status: 'published',
        });

        const userResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse1Body = await userResponse1.json();

        expect(userResponse1Body.tabcoins).toEqual(2);
        expect(userResponse1Body.tabcash).toEqual(0);

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse2Body = await userResponse2.json();

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "deleted" status (different user)', async () => {
        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(secondUser);
        const sessionObject = await orchestrator.createSession(secondUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body',
          status: 'published',
        });

        const secondUserResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const secondUserResponse1Body = await secondUserResponse1.json();

        expect(secondUserResponse1Body.tabcoins).toEqual(2);
        expect(secondUserResponse1Body.tabcash).toEqual(0);

        const contentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'deleted',
            }),
          }
        );

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(1);

        const secondUserResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const secondUserResponse2Body = await secondUserResponse2.json();

        expect(secondUserResponse2Body.tabcoins).toEqual(0);
        expect(secondUserResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "draft", and then "published" status (same user)', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          parent_id: rootContent.id,
          owner_id: defaultUser.id,
          title: 'Child',
          body: 'Body',
          status: 'published',
        });

        const draftContentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'draft',
            }),
          }
        );

        const draftContentResponseBody = await draftContentResponse.json();

        expect(draftContentResponseBody.tabcoins).toEqual(0);

        const userResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse1Body = await userResponse1.json();

        expect(userResponse1Body.tabcoins).toEqual(2);
        expect(userResponse1Body.tabcash).toEqual(0);

        const publishedContentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${defaultUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'published',
            }),
          }
        );

        const publishedContentResponseBody = await publishedContentResponse.json();

        expect(publishedContentResponseBody.tabcoins).toEqual(0);

        const userResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${defaultUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse2Body = await userResponse2.json();

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "draft", and then "published" status (different user)', async () => {
        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(secondUser);
        const sessionObject = await orchestrator.createSession(secondUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          parent_id: rootContent.id,
          owner_id: secondUser.id,
          title: 'Child',
          body: 'Body',
          status: 'published',
        });

        const draftContentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'draft',
            }),
          }
        );

        const draftContentResponseBody = await draftContentResponse.json();

        expect(draftContentResponseBody.tabcoins).toEqual(1);

        const userResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse1Body = await userResponse1.json();

        expect(userResponse1Body.tabcoins).toEqual(2);
        expect(userResponse1Body.tabcash).toEqual(0);

        const publishedContentResponse = await fetch(
          `${orchestrator.webserverUrl}/api/v1/contents/${secondUser.username}/${childContent.slug}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              cookie: `session_id=${sessionObject.token}`,
            },
            body: JSON.stringify({
              status: 'published',
            }),
          }
        );

        const publishedContentResponseBody = await publishedContentResponse.json();

        expect(publishedContentResponseBody.tabcoins).toEqual(1);

        const userResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponse2Body = await userResponse2.json();

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });
    });
  });
});
