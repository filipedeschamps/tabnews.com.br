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
    test('Creating "root" content', async () => {
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
    test('Creating "root" content with valid data', async () => {
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
    test('Creating "child" content with valid data', async () => {
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
    test('Creating content with another "owner_id"', async () => {
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
      expect(responseBody.slug).toEqual('tentando-criar-conteudo-em-nome-de-outro-usuario');
      expect(responseBody.title).toEqual('Tentando criar conteúdo em nome de outro usuário');
      expect(responseBody.body).toEqual('Campo "owner_id" da request deveria ser ignorado e pego através da sessão.');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Creating content without "body"', async () => {
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

    test('Creating content with custom "slug"', async () => {
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
      expect(responseBody.slug).toEqual('nodejs');
      expect(responseBody.title).toEqual('Mini curso de Node.js');
      expect(responseBody.body).toEqual('Instale o Node.js');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Creating content with "status" set to "draft"', async () => {
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
      expect(responseBody.slug).toEqual('deveria-criar-um-conteudo-com-status-draft');
      expect(responseBody.title).toEqual('Deveria criar um conteúdo com status "draft".');
      expect(responseBody.body).toEqual('Qualquer coisa.');
      expect(responseBody.status).toEqual('draft');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
    });

    test('Creating content with "status" set to "published"', async () => {
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
      expect(responseBody.slug).toEqual('deveria-criar-um-conteudo-com-status-published');
      expect(responseBody.title).toEqual('Deveria criar um conteúdo com status "published".');
      expect(responseBody.body).toEqual('E isso vai fazer ter um "published_at" preenchido automaticamente.');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('Creating content with "status" set to "deleted"', async () => {
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
          title: 'Deveria negar criar conteúdos diretamente com status "deleted".',
          body: 'Qualquer coisa.',
          status: 'deleted',
        }),
      });
      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Não é possível criar um conteúdo diretamente com status "deleted".');
      expect(responseBody.action).toEqual(
        'Você pode apenas criar conteúdos com "status" igual a "draft" ou "published".'
      );
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:INVALID_STATUS:DELETED');
    });

    test('Creating content with "status" set to "inexisting_status"', async () => {
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
      expect(responseBody.message).toEqual(
        '"status" deve possuir um dos seguintes valores: "draft", "published" ou "deleted".'
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Creating content with valid "source_url"', async () => {
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

    test('Creating "root" content with minimum valid data', async () => {
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

    test('Creating "root" content without "title"', async () => {
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
      expect(responseBody.message).toEqual('"title" é um campo obrigatório para conteúdos raiz.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual(
        'MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:MISSING_TITLE_WITHOUT_PARENT_ID'
      );
    });

    test('Creating "child" content with minimum valid data', async () => {
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

    test('Creating "child" content with "title"', async () => {
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
      expect(responseBody.slug).toEqual('titulo-em-um-child-content-o-que-vai-acontecer');
      expect(responseBody.title).toEqual('Título em um child content! O que vai acontecer?');
      expect(responseBody.body).toEqual('Deveria criar um slug baseado no "title"');
      expect(responseBody.status).toEqual('published');
      expect(responseBody.source_url).toEqual(null);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('Creating "child" content pointing to an inexistent "parent_id"', async () => {
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

      expect(response.status).toEqual(422);
      expect(responseBody.status_code).toEqual(422);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Você está tentando criar um sub-conteúdo para um conteúdo que não existe.');
      expect(responseBody.action).toEqual('Utilize um "parent_id" que aponte para um conteúdo que existe.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_unique_code).toEqual('MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND');
    });
  });
});
