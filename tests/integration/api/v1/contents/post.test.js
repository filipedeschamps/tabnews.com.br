import fetch from 'cross-fetch';
import { version as uuidVersion } from 'uuid';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/contents', () => {
  describe('Anonymous user', () => {
    test('Content with minimum valid data', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Anônimo tentando postar',
          body: 'Não deveria conseguir.',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Usuário não pode executar esta operação.');
      expect(responseBody.action).toEqual('Verifique se este usuário possui a feature "create:content".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User without "create:content:text_root" feature', () => {
    test('"root" content with valid data', async () => {
      const userWithoutFeature = await orchestrator.createUser();
      await orchestrator.activateUser(userWithoutFeature);
      await orchestrator.removeFeaturesFromUser(userWithoutFeature, ['create:content:text_root']);
      const sessionObject = await orchestrator.createSession(userWithoutFeature);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Usuário válido, tentando postar na raiz do site.',
          body: 'Não deveria conseguir, pois não possui a feature "create:content:text_root".',
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para criar conteúdos na raiz do site.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "create:content:text_root".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual(
        'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND'
      );
    });
  });

  describe('User without "create:content:text_child" feature', () => {
    test('"child" content with valid data', async () => {
      const defaultUser = await orchestrator.createUser();
      const userWithoutFeature = await orchestrator.createUser();
      await orchestrator.activateUser(userWithoutFeature);
      await orchestrator.removeFeaturesFromUser(userWithoutFeature, ['create:content:text_child']);
      const sessionObject = await orchestrator.createSession(userWithoutFeature);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo raiz',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Usuário válido, tentando postar uma resposta.',
          body: 'Não deveria conseguir, pois não possui a feature "create:content:text_child".',
          parent_id: rootContent.id,
          status: 'published',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual(
        'Você não possui permissão para criar conteúdos dentro de outros conteúdos.'
      );
      expect(responseBody.action).toEqual('Verifique se você possui a feature "create:content:text_child".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual(
        'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND'
      );
    });
  });

  describe('Default user', () => {
    test('Content without POST Body and "Content-Type"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
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

    test('Content with POST Body containing an invalid JSON string', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
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

    test('Content with "owner_id" pointing to another user', async () => {
      const firstUser = await orchestrator.createUser();
      await orchestrator.activateUser(firstUser);
      const firstUserSessionObject = await orchestrator.createSession(firstUser);
      const secondUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${firstUserSessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Tentando criar conteúdo em nome de outro usuário',
          body: 'Campo "owner_id" da request deveria ser ignorado e pego através da sessão.',
          owner_id: secondUser.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(firstUser.id);
      expect(responseBody.username).toEqual(firstUser.username);
      expect(responseBody.owner_id).not.toEqual(secondUser.id);
      expect(responseBody.username).not.toEqual(secondUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('tentando-criar-conteudo-em-nome-de-outro-usuario');
      expect(responseBody.title).toEqual('Tentando criar conteúdo em nome de outro usuário');
      expect(responseBody.body).toEqual('Campo "owner_id" da request deveria ser ignorado e pego através da sessão.');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "body" not declared', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Não deveria conseguir, falta o "body".',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing blank String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título normal',
          body: '',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título normal',
          body: 'A'.repeat(20001),
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título normal',
          body: ' Espaço no início e no fim ',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-normal');
      expect(responseBody.title).toEqual('Título normal');
      expect(responseBody.body).toEqual('Espaço no início e no fim');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "body" containing Null value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título normal',
          body: null,
        }),
      });

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

    test('Content with "slug" containing a custom valid value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Mini curso de Node.js',
          body: 'Instale o Node.js',
          slug: 'nodejs',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('nodejs');
      expect(responseBody.title).toEqual('Mini curso de Node.js');
      expect(responseBody.body).toEqual('Instale o Node.js');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "slug" containing a blank String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Mini curso de Node.js',
          body: 'Instale o Node.js',
          slug: '',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Mini curso de Node.js',
          body: 'Instale o Node.js',
          slug: 'this-slug-is-to-257-characterssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Mini curso de Node.js',
          body: 'Instale o Node.js',
          slug: 'slug-não-pode-ter-caracteres-especiais',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Mini curso de Node.js',
          body: 'Instale o Node.js',
          slug: null,
        }),
      });

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

    test('Content with "title" containing a blank String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: '',
          body: 'Qualquer coisa.',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title:
            'Este título possui 257 caracteresssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
          body: 'Qualquer coisa.',
        }),
      });

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

    test('Content with "title" containing untrimmed values', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: ' Título válido, mas com espaços em branco no início e no fim ',
          body: 'Qualquer coisa.',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo-valido-mas-com-espacos-em-branco-no-inicio-e-no-fim');
      expect(responseBody.title).toEqual('Título válido, mas com espaços em branco no início e no fim');
      expect(responseBody.body).toEqual('Qualquer coisa.');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "title" containing unescaped characters', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\o/'`,
          body: 'Qualquer coisa.',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('tab-e-news-conteudos-com-valor-strong-concreto-strong-e-massa-participe-o');
      expect(responseBody.title).toEqual(
        `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\o/'`
      );
      expect(responseBody.body).toEqual('Qualquer coisa.');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "status" set to "draft"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Deveria criar um conteúdo com status "draft".',
          body: 'Qualquer coisa.',
          status: 'draft',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('deveria-criar-um-conteudo-com-status-draft');
      expect(responseBody.title).toEqual('Deveria criar um conteúdo com status "draft".');
      expect(responseBody.body).toEqual('Qualquer coisa.');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "status" set to "published"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Deveria criar um conteúdo com status "published".',
          body: 'E isso vai fazer ter um "published_at" preenchido automaticamente.',
          status: 'published',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('deveria-criar-um-conteudo-com-status-published');
      expect(responseBody.title).toEqual('Deveria criar um conteúdo com status "published".');
      expect(responseBody.body).toEqual('E isso vai fazer ter um "published_at" preenchido automaticamente.');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('Content with "status" set to "non_existent_status"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Deveria negar.',
          body: 'Qualquer coisa.',
          status: 'inexisting_status',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Deveria negar.',
          body: 'Qualquer coisa.',
          status: null,
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Deveria negar.',
          body: 'Qualquer coisa.',
          status: '',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'TabNews',
          body: 'Somos pessoas brutalmente exatas e empáticas, simultaneamente.',
          source_url: 'http://www.tabnews.com.br/',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('tabnews');
      expect(responseBody.title).toEqual('TabNews');
      expect(responseBody.body).toEqual('Somos pessoas brutalmente exatas e empáticas, simultaneamente.');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual('http://www.tabnews.com.br/');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "source_url" containing a valid HTTPS URL', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'TabNews: Onde Tudo Começou',
          body: 'Aqui você vai encontrar POCs que foram criadas pela turma no início do projeto.',
          source_url: 'https://www.tabnews.com.br/museu',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('tabnews-onde-tudo-comecou');
      expect(responseBody.title).toEqual('TabNews: Onde Tudo Começou');
      expect(responseBody.body).toEqual(
        'Aqui você vai encontrar POCs que foram criadas pela turma no início do projeto.'
      );
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual('https://www.tabnews.com.br/museu');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "source_url" containing a not accepted Protocol', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Titulo',
          body: 'Corpo',
          source_url: 'ftp://www.tabnews.com.br',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Titulo',
          body: 'Corpo',
          source_url: 'https://lol.',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Titulo',
          body: 'Corpo',
          source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=ascending',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo');
      expect(responseBody.title).toEqual('Titulo');
      expect(responseBody.body).toEqual('Corpo');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual('https://www.tabnews.com.br/api/v1/contents?strategy=ascending');
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Content with "source_url" containing an empty String', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Titulo',
          body: 'Corpo',
          source_url: '',
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Titulo',
          body: 'Corpo',
          source_url: null,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual('titulo');
      expect(responseBody.title).toEqual('Titulo');
      expect(responseBody.body).toEqual('Corpo');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('"root" content with minimum valid data', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title:
            'Deveria conseguir! E o campo "slug" é opcional & 95,5% dos usuários não usam :) [áéíóú?@#$*<>|+-=.,;:_] <- (caracteres especiais)',
          body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(null);
      expect(responseBody.parent_title).toEqual(null);
      expect(responseBody.parent_slug).toEqual(null);
      expect(responseBody.parent_username).toEqual(null);
      expect(responseBody.slug).toEqual(
        'deveria-conseguir-e-o-campo-slug-e-opcional-e-95-5-por-cento-dos-usuarios-nao-usam-aeiou-caracteres-especiais'
      );
      expect(responseBody.title).toEqual(
        'Deveria conseguir! E o campo "slug" é opcional & 95,5% dos usuários não usam :) [áéíóú?@#$*<>|+-=.,;:_] <- (caracteres especiais)'
      );
      expect(responseBody.body).toEqual(
        'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".'
      );
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('"root" content with "title" not declared', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          body: 'Não deveria conseguir, falta o "title".',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"title" é um campo obrigatório.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('"root" content with "title" containing Null value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: null,
          body: 'Não deveria conseguir, falta o "title".',
        }),
      });

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

    test('"child" content with minimum valid data', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo raiz',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
          parent_id: rootContent.id,
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(rootContent.id);
      expect(responseBody.parent_title).toEqual(rootContent.title);
      expect(responseBody.parent_slug).toEqual(rootContent.slug);
      expect(responseBody.parent_username).toEqual(rootContent.username);
      expect(uuidVersion(responseBody.slug)).toEqual(4);
      expect(responseBody.title).toEqual(null);
      expect(responseBody.body).toEqual(
        'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".'
      );
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('"child" content with "title" containing Null value', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo raiz',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: null,
          body: 'Deveria criar um slug com UUID V4',
          parent_id: rootContent.id,
          status: 'published',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(rootContent.id);
      expect(responseBody.parent_title).toEqual(rootContent.title);
      expect(responseBody.parent_slug).toEqual(rootContent.slug);
      expect(responseBody.parent_username).toEqual(rootContent.username);
      expect(uuidVersion(responseBody.slug)).toEqual(4);
      expect(responseBody.title).toEqual(null);
      expect(responseBody.body).toEqual('Deveria criar um slug com UUID V4');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('"child" content with "title"', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const rootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo raiz',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Título em um child content! O que vai acontecer?',
          body: 'Deveria criar um slug baseado no "title"',
          parent_id: rootContent.id,
          status: 'published',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);
      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(responseBody.owner_id).toEqual(defaultUser.id);
      expect(responseBody.username).toEqual(defaultUser.username);
      expect(responseBody.parent_id).toEqual(rootContent.id);
      expect(responseBody.parent_title).toEqual(rootContent.title);
      expect(responseBody.parent_slug).toEqual(rootContent.slug);
      expect(responseBody.parent_username).toEqual(rootContent.username);
      expect(responseBody.slug).toEqual('titulo-em-um-child-content-o-que-vai-acontecer');
      expect(responseBody.title).toEqual('Título em um child content! O que vai acontecer?');
      expect(responseBody.body).toEqual('Deveria criar um slug baseado no "title"');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('"child" content with "parent_id" containing a Number', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          body: 'Não deveria conseguir, pois o "parent_id" abaixo está num formato errado',
          parent_id: 123456,
        }),
      });

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

    test('"child" content with "parent_id" containing a blank string', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          body: 'Não deveria conseguir, pois o "parent_id" abaixo está num formato errado',
          parent_id: '',
        }),
      });

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

    test('"child" content with "parent_id" containing a malformatted UUIDV4', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          body: 'Não deveria conseguir, pois o "parent_id" abaixo está num formato errado',
          parent_id: 'isso não é um UUID válido',
        }),
      });

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

    test('"child" content with "parent_id" that does not exists', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          body: 'Não deveria conseguir, pois o "parent_id" aqui embaixo não existe.',
          parent_id: 'fe2e20f5-9296-45ea-9a0f-401866819b9e',
        }),
      });

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
