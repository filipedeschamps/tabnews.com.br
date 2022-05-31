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
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/username/slug`, {
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
      expect(responseBody.error_unique_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User without "update:content" feature', () => {
    test('"root" content with valid data', async () => {
      const userWithoutFeature = await orchestrator.createUser();
      await orchestrator.activateUser(userWithoutFeature);
      await orchestrator.removeFeaturesFromUser(userWithoutFeature, ['update:content']);
      const sessionObject = await orchestrator.createSession(userWithoutFeature);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/username/slug`, {
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
      expect(responseBody.error_unique_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('Default user', () => {
    test('Content without PATCH Body and "Content-Type"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/username/slug`, {
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with PATCH Body containing an invalid JSON string', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/username/slug`, {
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with PATCH Body containing an empty Object', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents/username/slug`, {
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with invalid "slug" in the URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/contents/username/%3Cscript%3Ealert%28%29%3Cscript%3E`,
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:USER:FIND_ONE_BY_USERNAME:NOT_FOUND');
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
      expect(responseBody.error_unique_code).toEqual('CONTROLLER:CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND');
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
      expect(responseBody.error_unique_code).toEqual(
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.id).toEqual(firstUserContent.id);
      expect(responseBody.owner_id).toEqual(firstUser.id);
      expect(responseBody.username).toEqual(firstUser.username);
      expect(responseBody.owner_id).not.toEqual(secondUser.id);
      expect(responseBody.username).not.toEqual(secondUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('conteudo-do-primeiro-usuario-antes-do-patch');
      expect(responseBody.title).toEqual('Tentando atualizar o dono do conteúdo.');
      expect(responseBody.body).toEqual('Campo "owner_id" da request deveria ser ignorado e pego através da sessão.');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body novo');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Espaço no início e no fim');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('slug-novo');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing more than 256 characters', async () => {
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
            slug: 'this-slug-is-to-257-characterssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"slug" deve conter no máximo 256 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título novo');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title" containing more than 256 characters', async () => {
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
              'Este título possui 257 caracteresssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"title" deve conter no máximo 256 caracteres.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE');
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.id).toEqual(childContent.id);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.parent_title).toEqual(rootContent.title);
      expect(responseBody.parent_slug).toEqual(rootContent.slug);
      expect(responseBody.parent_username).toEqual(rootContent.username);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(rootContent.id);
      expect(responseBody.slug).toEqual('child-old-title');
      expect(responseBody.title).toEqual(null);
      expect(responseBody.body).toEqual('Child old body');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título válido, mas com espaços em branco no início e no fim');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual(
        `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\o/'`
      );
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
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
      expect(uuidVersion(republishedResponseBody.id)).toEqual(4);
      expect(republishedResponseBody.owner_id).toEqual(defaultUser.id);
      expect(republishedResponseBody.username).toEqual(defaultUser.username);
      expect(republishedResponseBody.parent_id).toEqual(null);
      expect(republishedResponseBody.parent_title).toEqual(null);
      expect(republishedResponseBody.parent_slug).toEqual(null);
      expect(republishedResponseBody.parent_username).toEqual(null);
      expect(republishedResponseBody.slug).toEqual('titulo-velho');
      expect(republishedResponseBody.title).toEqual('Título velho');
      expect(republishedResponseBody.body).toEqual('Body velho');
      expect(republishedResponseBody.status).toEqual('published');
      expect(republishedResponseBody.source_url).toEqual(null);
      expect(Date.parse(republishedResponseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(republishedResponseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(republishedResponseBody.published_at)).not.toEqual(NaN);
      expect(draftResponseBody.published_at).toEqual(originalContent.published_at.toISOString());
      expect(draftResponseBody.published_at).toEqual(republishedResponseBody.published_at);
      expect(draftResponseBody.updated_at > originalContent.updated_at.toISOString()).toEqual(true);
      expect(republishedResponseBody.updated_at > draftResponseBody.updated_at).toEqual(true);
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
      expect(responseBody.message).toEqual('"status" deve possuir um dos seguintes valores: "draft" ou "published".');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.message).toEqual('"status" deve possuir um dos seguintes valores: "draft" ou "published".');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.message).toEqual('"status" deve possuir um dos seguintes valores: "draft" ou "published".');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual('http://www.tabnews.com.br/');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual('https://www.tabnews.com.br/museu');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a valid long TLD', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Um baita de um Top-Level Domain',
        body: 'O maior TLD que foi encontrado no dia do commit possuía 18 caracteres',
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
            source_url: 'https://nic.northwesternmutual/',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('um-baita-de-um-top-level-domain');
      expect(responseBody.title).toEqual('Um baita de um Top-Level Domain');
      expect(responseBody.body).toEqual('O maior TLD que foi encontrado no dia do commit possuía 18 caracteres');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual('https://nic.northwesternmutual/');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a invalid long TLD', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Um Top-Level Domain maior que o permitido',
        body: 'O maior TLD que foi encontrado no dia do commit possuía 18 caracteres',
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
            source_url: 'https://tldco.mdezenovecaracteres',
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
            source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=ascending',
          }),
        }
      );

      const responseBody = await response.json();

      expect(response.status).toEqual(200);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual('https://www.tabnews.com.br/api/v1/contents?strategy=ascending');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-velho');
      expect(responseBody.title).toEqual('Título velho');
      expect(responseBody.body).toEqual('Body velho');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(rootContent.id);
      expect(responseBody.parent_title).toEqual(rootContent.title);
      expect(responseBody.parent_slug).toEqual(rootContent.slug);
      expect(responseBody.parent_username).toEqual(rootContent.username);
      expect(responseBody.slug).toEqual('child-content-title');
      expect(responseBody.title).toEqual('Child content title');
      expect(responseBody.body).toEqual('Child content body');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('child-content-title');
      expect(responseBody.title).toEqual('Child content title');
      expect(responseBody.body).toEqual('Child content body');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
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
      expect(responseBody.error_unique_code).toEqual('MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:CONTENT:CHECK_FOR_PARENT_ID_RECURSION:RECURSION_FOUND');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_unique_code).toEqual('MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND');
    });
  });
});
