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
      expect(responseBody.error_location_code).toEqual('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
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
      expect(responseBody.error_location_code).toEqual(
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
      expect(responseBody.error_location_code).toEqual(
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: firstUser.id,
        parent_id: null,
        slug: 'tentando-criar-conteudo-em-nome-de-outro-usuario',
        title: 'Tentando criar conteúdo em nome de outro usuário',
        body: 'Campo "owner_id" da request deveria ser ignorado e pego através da sessão.',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        owner_username: firstUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing empty Markdown', async () => {
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
          body: `![](https://image-url.com/image.png)
          <div>\u00a0</div>
          <b>\u2800</b>
          <>\u200e</>
          <p>\u200f</p>
          <h1>\u0009</h1>
          <strong>\u0020</strong>
          <em><\u00ad/em>
          <abbr>͏</abbr>
          <address>\u061c</address>
          <bdo>\u180e</bdo>
          <q>\u2000</q>
          <code>\u2001</code>
          <ins>\u2002</ins>
          <del>\u2003</del>
          <dfn>\u2004</dfn>
          <kbd>\u2005</kbd>
          <pre>\u2006</pre>
          <samp>\u2007</samp>
          <var>\u2008</var>
          <br>\u2009</br>
          <div>\u200a</div>
          <a>\u200b</a>
          <base>\u200c</base>
          <img>\u200d</img>
          <area>\u200e</area>
          <map>\u200f</map>
          <param>\u205f</param>
          <object>\u2060</object>
          <ul>\u2061</ul>
          <ol>\u2062</ol>
          <li>\u2063</li>
          <dl>\u2064</dl>
          <dd>\u206a</dd>
          <h1>\u206b</h1>
          <h2>\u206c</h2>
          <h3>\u206d</h3>
          <h4>\u3000</h4>
          <h5>\ufeff</h5>
          <h6>𝅳</h6>
          <>𝅴</>
          <>𝅵</>
          <>𝅶</>
          <>𝅷</>
          <>𝅸</>
          <>𝅹</>
          <>𝅺</>
          <>\u115f</>
          <>\u1160</>
          <>\u17b4</>
          <>\u17b5</>
          <>\u3164</>
          <>\uffa0</>
          </code></a></div></other>
          <code><a><div><other>
          `,
        }),
      });

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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: '\u0000Começando com caractere proibido no Postgres',
          body: 'Terminando com caractere proibido no Postgres\u0000',
          source_url: 'https://teste-\u0000caractere.invalido/\u0000',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'comecando-com-caractere-proibido-no-postgres',
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

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: '\u200eTítulo começando e terminando com caracteres inválidos.\u2800',
          body: '\u200fTexto começando e terminando com caracteres inválidos.\u200e',
        }),
      });

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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" deve começar com caracteres visíveis.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
          body: 'Espaço só no fim ',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-normal',
        title: 'Título normal',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'nodejs',
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing more than 255 bytes', async () => {
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
          slug: 'this-slug-must-be-changed-to-255-bytesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'this-slug-must-be-changed-to-255-bytessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing the same value of another content (same user, both "published" status)', async () => {
      const defaultUser = await orchestrator.createUser();
      await orchestrator.activateUser(defaultUser);
      const sessionObject = await orchestrator.createSession(defaultUser);

      const existingContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo existente',
        body: 'Conteúdo existente',
        slug: 'conteudo-existente',
        status: 'published',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Conteúdo existente',
          body: 'Outro body',
          slug: 'conteudo-existente',
          status: 'published',
        }),
      });

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

      const existingContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo existente',
        body: 'Conteúdo existente',
        slug: 'conteudo-existente',
        status: 'draft',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Conteúdo existente',
          body: 'Outro body',
          slug: 'conteudo-existente',
          status: 'published',
        }),
      });

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
        title: 'Conteúdo existente',
        body: 'Conteúdo existente',
        slug: 'conteudo-existente',
        status: 'published',
      });

      await orchestrator.updateContent(firstContent.id, {
        status: 'deleted',
      });

      const secondContent = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          title: 'Conteúdo existente',
          body: 'Outro body',
          slug: 'conteudo-existente',
          status: 'published',
        }),
      });

      const secondContentBody = await secondContent.json();

      expect(secondContent.status).toEqual(201);

      expect(secondContentBody).toStrictEqual({
        id: secondContentBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'conteudo-existente',
        title: 'Conteúdo existente',
        body: 'Outro body',
        status: 'published',
        tabcoins: 1,
        source_url: null,
        created_at: secondContentBody.created_at,
        updated_at: secondContentBody.updated_at,
        published_at: secondContentBody.published_at,
        deleted_at: null,
        owner_username: defaultUser.username,
      });

      expect(Date.parse(secondContentBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(secondContentBody.published_at)).not.toEqual(NaN);
      expect(Date.parse(secondContentBody.updated_at)).not.toEqual(NaN);
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title" containing more than 255 characters', async () => {
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
            'Este título possui 256 caracteressssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
          body: 'Qualquer coisa.',
        }),
      });

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

    test('Content with "title" containing 255 characters but more than 255 bytes', async () => {
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
            'Este título possui 255 caracteres ocupando 256 bytes e deve com 100% de certeza gerar um slug ocupando menos de 256 bytesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
          body: 'Instale o Node.js',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'este-titulo-possui-255-caracteres-ocupando-256-bytes-e-deve-com-100-por-cento-de-certeza-gerar-um-slug-ocupando-menos-de-256-bytessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        title:
          'Este título possui 255 caracteres ocupando 256 bytes e deve com 100% de certeza gerar um slug ocupando menos de 256 bytesssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        body: 'Instale o Node.js',
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
    });

    test('Content with "title" containing Braille Pattern Blank Unicode Character', async () => {
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
          title: '\u2800 Braille Pattern Blank Unicode Character \u2800',
          body: 'Instale o Node.js',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'braille-pattern-blank-unicode-character',
        title: 'Braille Pattern Blank Unicode Character',
        body: 'Instale o Node.js',
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
    });

    test('Content with "title" containing special characters occupying more than 255 bytes', async () => {
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
          title: '♥'.repeat(255),
          body: 'The title is 255 characters but 765 bytes and the slug should only be 255 bytes',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: '4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pml4pm',
        title: '♥'.repeat(255),
        body: 'The title is 255 characters but 765 bytes and the slug should only be 255 bytes',
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-valido-mas-com-espacos-em-branco-no-inicio-e-no-fim',
        title: 'Título válido, mas com espaços em branco no início e no fim',
        body: 'Qualquer coisa.',
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'tab-e-news-conteudos-com-valor-strong-concreto-strong-e-massa-participe-o',
        title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\o/'`,
        body: 'Qualquer coisa.',
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'deveria-criar-um-conteudo-com-status-draft',
        title: 'Deveria criar um conteúdo com status "draft".',
        body: 'Qualquer coisa.',
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'deveria-criar-um-conteudo-com-status-published',
        title: 'Deveria criar um conteúdo com status "published".',
        body: 'E isso vai fazer ter um "published_at" preenchido automaticamente.',
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
    });

    test('Content with "status" set to "deleted"', async () => {
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
          title: 'Deveria negar a criação de um conteúdo direto em "deleted".',
          body: 'Não faz sentido criar conteúdos deletados.',
          status: 'deleted',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Não é possível criar um novo conteúdo diretamente com status "deleted".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:STATUS_DELETED',
        key: 'status',
        type: 'any.only',
      });
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'tabnews',
        title: 'TabNews',
        body: 'Somos pessoas brutalmente exatas e empáticas, simultaneamente.',
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'tabnews-onde-tudo-comecou',
        title: 'TabNews: Onde Tudo Começou',
        body: 'Aqui você vai encontrar POCs que foram criadas pela turma no início do projeto.',
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
    });

    test('Content with "source_url" containing a valid long TLD', async () => {
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
          title: 'Um baita de um Top-Level Domain',
          body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
          source_url: 'http://nic.xn--vermgensberatung-pwb/',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'um-baita-de-um-top-level-domain',
        title: 'Um baita de um Top-Level Domain',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
        status: 'draft',
        source_url: 'http://nic.xn--vermgensberatung-pwb/',
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

    test('Content with "source_url" containing a valid short URL', async () => {
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
          title: 'URL bem curta',
          body: 'Por exemplo o encurtador do Telegram',
          source_url: 'https://t.me',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'url-bem-curta',
        title: 'URL bem curta',
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
    });

    test('Content with "source_url" containing a invalid short TLD', async () => {
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
          title: 'Um Top-Level Domain menor que o permitido',
          body: 'TLDs precisam ter pelo menos dois caracteres',
          source_url: 'https://invalidtl.d',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a invalid long TLD', async () => {
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
          title: 'Um Top-Level Domain maior que o permitido',
          body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
          source_url: 'http://tl.dcomvinteecincocaracteres',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" not containing a protocol', async () => {
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
          source_url: 'www.tabnews.com.br',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
          source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=old',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo',
        title: 'Titulo',
        body: 'Corpo',
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
    });

    test('Content with "source_url" containing fragment component', async () => {
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
          source_url: 'http://www.tabnews.com.br/#:~:text=TabNews,-Status',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo',
        title: 'Titulo',
        body: 'Corpo',
        status: 'draft',
        source_url: 'http://www.tabnews.com.br/#:~:text=TabNews,-Status',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo',
        title: 'Titulo',
        body: 'Corpo',
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'deveria-conseguir-e-o-campo-slug-e-opcional-e-95-5-por-cento-dos-usuarios-nao-usam-aeiou-caracteres-especiais',
        title:
          'Deveria conseguir! E o campo "slug" é opcional & 95,5% dos usuários não usam :) [áéíóú?@#$*<>|+-=.,;:_] <- (caracteres especiais)',
        body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
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
    });

    test('"root" content with "title" containing custom slug special characters', async () => {
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
          title: 'under_score 5% é >= 1 e <= 10 email@dominio.com #item1,item2 a&b | a & b/mil',
          body: 'Body',
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'under-score-5-por-cento-e-1-e-10-email-dominio-com-item1-item2-a-e-b-a-e-b-mil',
        title: 'under_score 5% é >= 1 e <= 10 email@dominio.com #item1,item2 a&b | a & b/mil',
        body: 'Body',
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE');
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: responseBody.slug,
        title: null,
        body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
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
      expect(uuidVersion(responseBody.slug)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: responseBody.slug,
        title: null,
        body: 'Deveria criar um slug com UUID V4',
        status: 'published',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(uuidVersion(responseBody.slug)).toEqual(4);
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

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: 'titulo-em-um-child-content-o-que-vai-acontecer',
        title: 'Título em um child content! O que vai acontecer?',
        body: 'Deveria criar um slug baseado no "title"',
        status: 'published',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
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
      expect(responseBody.error_location_code).toEqual('MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND');
    });

    describe('Notifications', () => {
      test('Create "root" content', async () => {
        await orchestrator.deleteAllEmails();

        const firstUser = await orchestrator.createUser();
        await orchestrator.activateUser(firstUser);
        const firstUserSessionObject = await orchestrator.createSession(firstUser);

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Usuário não deveria receber email de notificação',
            body: 'Ele não deveria ser notificado sobre suas próprias criações',
            status: 'published',
          }),
        });

        const getLastEmail = await orchestrator.getLastEmail();

        expect(response.status).toBe(201);
        expect(getLastEmail).toBe(null);
      });

      test('My "root" content replied by myself', async () => {
        await orchestrator.deleteAllEmails();

        const firstUser = await orchestrator.createUser();
        await orchestrator.activateUser(firstUser);
        const firstUserSessionObject = await orchestrator.createSession(firstUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Conteúdo raiz',
          status: 'published',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Novamente, não deveria receber notificação',
            body: 'Continua não sendo notificado sobre suas próprias criações',
            parent_id: rootContent.id,
            status: 'published',
          }),
        });

        const responseBody = await response.json();

        const getLastEmail = await orchestrator.getLastEmail();

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(rootContent.id);
        expect(getLastEmail).toBe(null);
      });

      test('My "root" content with short "title" replied by other user', async () => {
        await orchestrator.deleteAllEmails();

        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(firstUser);
        await orchestrator.activateUser(secondUser);
        const secondUserSessionObject = await orchestrator.createSession(secondUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Título curto do conteúdo raiz',
          status: 'published',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Autor do `parent_id` deve receber notificação avisando que eu respondi o conteúdo dele.',
            parent_id: rootContent.id,
            status: 'published',
          }),
        });

        const responseBody = await response.json();

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${secondUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(rootContent.id);
        expect(getLastEmail.recipients[0].includes(firstUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(`"${secondUser.username}" comentou em "Título curto do conteúdo raiz"`);
        expect(getLastEmail.text.includes(firstUser.username)).toBe(true);
        expect(getLastEmail.text.includes(secondUser.username)).toBe(true);
        expect(getLastEmail.text.includes(rootContent.title)).toBe(true);
        expect(getLastEmail.text.includes('respondeu à sua publicação')).toBe(true);
        expect(getLastEmail.text.includes(childContentUrl)).toBe(true);
      });

      test('My "root" content with long "title" replied by other user', async () => {
        await orchestrator.deleteAllEmails();

        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(firstUser);
        await orchestrator.activateUser(secondUser);
        const secondUserSessionObject = await orchestrator.createSession(secondUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Título longo do conteúdo raiz, deveria cortar o título para caber título no email',
          status: 'published',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Autor do `parent_id` deve receber notificação avisando que eu respondi o conteúdo dele.',
            parent_id: rootContent.id,
            status: 'published',
          }),
        });

        const responseBody = await response.json();

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${secondUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(rootContent.id);
        expect(getLastEmail.recipients[0].includes(firstUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(
          `"${secondUser.username}" comentou em "Título longo do conteúdo raiz, deveria cortar o título ..."`
        );
        expect(getLastEmail.text.includes(`Olá, ${firstUser.username}`)).toBe(true);
        expect(getLastEmail.text.includes(rootContent.title)).toBe(true);
        expect(getLastEmail.text.includes(`"${secondUser.username}" respondeu à sua publicação`)).toBe(true);
        expect(getLastEmail.text.includes(childContentUrl)).toBe(true);
      });

      test('My "child" content replied by other user', async () => {
        await orchestrator.deleteAllEmails();

        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(firstUser);
        await orchestrator.activateUser(secondUser);
        const firstUserSessionObject = await orchestrator.createSession(firstUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Testando resposta ao conteúdo child',
          status: 'published',
        });

        const childContentFromSecondUser = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          body: 'Este conteúdo será respondido pelo "firstUser" no passo seguinte.',
          status: 'published',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Este conteúdo deverá disparar uma notificação ao "secondUser',
            parent_id: childContentFromSecondUser.id,
            status: 'published',
          }),
        });

        const responseBody = await response.json();

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${firstUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(childContentFromSecondUser.id);
        expect(getLastEmail.recipients[0].includes(secondUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(`"${firstUser.username}" comentou em "Testando resposta ao conteúdo child"`);
        expect(getLastEmail.text.includes(`Olá, ${secondUser.username}`)).toBe(true);
        expect(getLastEmail.text.includes(rootContent.title)).toBe(true);
        expect(getLastEmail.text.includes(`"${firstUser.username}" respondeu ao seu comentário na publicação`)).toBe(
          true
        );
        expect(getLastEmail.text.includes(childContentUrl)).toBe(true);
      });

      test('My "child" content replied by other user, but "root" with "deleted" status', async () => {
        await orchestrator.deleteAllEmails();

        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(firstUser);
        await orchestrator.activateUser(secondUser);
        const firstUserSessionObject = await orchestrator.createSession(firstUser);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Testando resposta ao conteúdo child',
          status: 'published',
        });

        const childContentFromSecondUser = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          body: 'Este conteúdo será respondido pelo "firstUser" no passo seguinte.',
          status: 'published',
        });

        await orchestrator.updateContent(rootContent.id, {
          status: 'deleted',
        });

        const response = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Este conteúdo deverá disparar uma notificação ao "secondUser',
            parent_id: childContentFromSecondUser.id,
            status: 'published',
          }),
        });

        const responseBody = await response.json();

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${firstUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(childContentFromSecondUser.id);
        expect(getLastEmail.recipients[0].includes(secondUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(`"${firstUser.username}" comentou em "[Não disponível]"`);
        expect(getLastEmail.text.includes(`Olá, ${secondUser.username}`)).toBe(true);
        expect(getLastEmail.text.includes(rootContent.title)).toBe(false);
        expect(
          getLastEmail.text.includes(
            `"${firstUser.username}" respondeu ao seu comentário na publicação "[Não disponível]"`
          )
        ).toBe(true);
        expect(getLastEmail.text.includes(childContentUrl)).toBe(true);
      });

      test('My "root" content replied by other user (with "notifications" disabled)', async () => {
        await orchestrator.deleteAllEmails();

        const firstUser = await orchestrator.createUser();
        const secondUser = await orchestrator.createUser();
        await orchestrator.activateUser(firstUser);
        await orchestrator.activateUser(secondUser);
        const firstUserSessionObject = await orchestrator.createSession(firstUser);
        const secondUserSessionObject = await orchestrator.createSession(secondUser);

        // 1) CHECK IF BY DEFAULT FIRST USER HAS `notifications` ENABLED
        const userGetResponseCheck1 = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
        });

        const userGetResponseCheck1Body = await userGetResponseCheck1.json();
        expect(userGetResponseCheck1Body.notifications).toBe(true);

        // 2) DISABLE NOTIFICATIONS FOR FIRST USER
        const userPatchResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            notifications: false,
          }),
        });

        expect(userPatchResponse1.status).toBe(200);

        const userGetResponseCheck2 = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
        });

        const userGetResponseCheck2Body = await userGetResponseCheck2.json();
        expect(userGetResponseCheck2Body.notifications).toBe(false);

        // 3) CREATE A CONTENT WITH FIRST USER
        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Testando sistema de notificação',
          status: 'published',
        });

        // 4) REPLY TO CONTENT WITH SECOND USER
        const contentResponse1 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Autor do `parent_id` NÃO deve receber notificação avisando que eu respondi o conteúdo dele.',
            parent_id: rootContent.id,
            status: 'published',
          }),
        });

        expect(contentResponse1.status).toBe(201);

        // 5) CHECK IF FIRST USER RECEIVED ANY EMAIL
        const getLastEmail1 = await orchestrator.getLastEmail();
        expect(getLastEmail1).toBe(null);

        // 6) ENABLE NOTIFICATIONS FOR FIRST USER
        const userPatchResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${firstUser.username}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${firstUserSessionObject.token}`,
          },
          body: JSON.stringify({
            notifications: true,
          }),
        });

        expect(userPatchResponse1.status).toBe(200);

        // 7) REPLY AGAIN TO CONTENT WITH SECOND USER
        const contentResponse2 = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${secondUserSessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Agora sim autor do `parent_id` deveria receber notificação.',
            parent_id: rootContent.id,
            status: 'published',
          }),
        });

        const contentResponse2Body = await contentResponse2.json();

        expect(contentResponse2.status).toBe(201);

        // 8) CHECK IF FIRST USER RECEIVED ANY EMAIL
        const getLastEmail2 = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${secondUser.username}/${contentResponse2Body.slug}`;

        expect(getLastEmail2.recipients[0].includes(firstUser.email)).toBe(true);
        expect(getLastEmail2.subject).toBe(`"${secondUser.username}" comentou em "Testando sistema de notificação"`);
        expect(getLastEmail2.text.includes(firstUser.username)).toBe(true);
        expect(getLastEmail2.text.includes(secondUser.username)).toBe(true);
        expect(getLastEmail2.text.includes(rootContent.title)).toBe(true);
        expect(getLastEmail2.text.includes('respondeu à sua publicação')).toBe(true);
        expect(getLastEmail2.text.includes(childContentUrl)).toBe(true);
      });
    });

    describe('TabCoins', () => {
      test('"root" content with "draft" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const contentResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Title',
            body: 'Body',
          }),
        });

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

      test('"root" content with "published" status', async () => {
        const defaultUser = await orchestrator.createUser();
        await orchestrator.activateUser(defaultUser);
        const sessionObject = await orchestrator.createSession(defaultUser);

        const contentResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            title: 'Title',
            body: 'Body',
            status: 'published',
          }),
        });

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

      test('"child" content with "draft" status', async () => {
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

        const contentResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Body',
            parent_id: rootContent.id,
            status: 'draft',
          }),
        });

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(0);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"child" content with "published" status (same user)', async () => {
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

        // But user will not receive additional tabcoins for
        // publishing a child content to itself.
        const contentResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Body',
            parent_id: rootContent.id,
            status: 'published',
          }),
        });

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

      test('"child" content with "published" status (different user)', async () => {
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

        const contentResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/contents`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            body: 'Body',
            parent_id: rootContent.id,
            status: 'published',
          }),
        });

        const contentResponseBody = await contentResponse.json();

        expect(contentResponseBody.tabcoins).toEqual(1);

        const userResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/users/${secondUser.username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const userResponseBody = await userResponse.json();

        expect(userResponseBody.tabcoins).toEqual(2);
        expect(userResponseBody.tabcash).toEqual(0);
      });
    });
  });
});
