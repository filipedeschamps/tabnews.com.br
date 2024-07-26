import { version as uuidVersion } from 'uuid';

import database from 'infra/database';
import { defaultTabCashForAdCreation, maxSlugLength, maxTitleLength, relevantBody } from 'tests/constants-for-tests';
import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/contents', () => {
  describe('Anonymous user', () => {
    test('Content with minimum valid data', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Anônimo tentando postar',
        body: 'Não deveria conseguir.',
      });

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Usuário não pode executar esta operação.');
      expect(responseBody.action).toBe('Verifique se este usuário possui a feature "create:content".');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND');
    });
  });

  describe('User without "create:content:text_root" feature', () => {
    test('"root" content with valid data', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser({ without: ['create:content:text_root'] });

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Usuário válido, tentando postar na raiz do site.',
        body: 'Não deveria conseguir, pois não possui a feature "create:content:text_root".',
      });

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Você não possui permissão para criar conteúdos na raiz do site.');
      expect(responseBody.action).toBe('Verifique se você possui a feature "create:content:text_root".');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe(
        'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      );
    });
  });

  describe('User without "create:content:text_child" feature', () => {
    test('"child" content with valid data', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { responseBody: rootContent } = await contentsRequestBuilder.post({
        title: 'Conteúdo raiz',
        body: 'Body',
        status: 'published',
      });

      await contentsRequestBuilder.buildUser({ without: ['create:content:text_child'] });

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Usuário válido, tentando postar uma resposta.',
        body: 'Não deveria conseguir, pois não possui a feature "create:content:text_child".',
        parent_id: rootContent.id,
        status: 'published',
      });

      expect(response.status).toBe(403);
      expect(responseBody.status_code).toBe(403);
      expect(responseBody.name).toBe('ForbiddenError');
      expect(responseBody.message).toBe('Você não possui permissão para criar conteúdos dentro de outros conteúdos.');
      expect(responseBody.action).toBe('Verifique se você possui a feature "create:content:text_child".');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe(
        'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      );
    });
  });

  describe('Default user', () => {
    test('Content without POST Body and "Content-Type"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();
      contentsRequestBuilder.buildHeaders({ 'Content-Type': undefined });

      const { response, responseBody } = await contentsRequestBuilder.post();

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with POST Body containing an invalid JSON string', async () => {
      const contentsRequestBuilder = new RequestBuilder();
      await contentsRequestBuilder.buildUser();
      contentsRequestBuilder.buildHeaders({ 'Content-Type': undefined });

      const { response, responseBody } = await contentsRequestBuilder.post(
        '/api/v1/contents',
        'Texto corrido no lugar de um JSON',
      );

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "owner_id" pointing to another user', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const firstUser = await contentsRequestBuilder.buildUser();

      const secondUser = await orchestrator.createUser();
      await orchestrator.activateUser(secondUser);

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Tentando criar conteúdo em nome de outro usuário',
        body: 'Campo "owner_id" da request deveria ser ignorado e pego através da sessão.',
        owner_id: secondUser.id,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: firstUser.id,
        parent_id: null,
        slug: 'tentando-criar-conteudo-em-nome-de-outro-usuario',
        title: 'Tentando criar conteúdo em nome de outro usuário',
        body: 'Campo "owner_id" da request deveria ser ignorado e pego através da sessão.',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: firstUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "body" not declared', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Não deveria conseguir, falta o "body".',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Título normal',
        body: '',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing empty Markdown', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
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
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('Markdown deve conter algum texto.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title", "body" and "source_url" containing \\u0000 null characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: '\u0000Começando com caractere proibido no Postgres',
        body: 'Terminando com caractere proibido no Postgres\u0000',
        source_url: 'https://teste-\u0000caractere.invalido/\u0000',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'comecando-com-caractere-proibido-no-postgres',
        title: 'Começando com caractere proibido no Postgres',
        body: 'Terminando com caractere proibido no Postgres',
        status: 'draft',
        type: 'content',
        source_url: 'https://teste-caractere.invalido/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "title" and "body" containing invalid characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: '\u200eTítulo começando e terminando com caracteres inválidos.\u2800',
        body: '\u200fTexto começando e terminando com caracteres inválidos.\u200e',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" deve começar com caracteres visíveis.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing more than 20.000 characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Título normal',
        body: 'A'.repeat(20001),
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" deve conter no máximo 20000 caracteres.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" containing untrimmed values', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Título normal',
        body: ' Espaço no início e no fim ',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" deve começar com caracteres visíveis.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "body" ending with untrimmed values', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Título normal',
        body: 'Espaço só no fim ',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-normal',
        title: 'Título normal',
        body: 'Espaço só no fim',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "body" containing Null value', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Título normal',
        body: null,
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"body" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing a custom valid value', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        slug: 'nodejs',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'nodejs',
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "slug" containing a blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        slug: '',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"slug" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test(`Content with "slug" containing more than ${maxSlugLength} bytes`, async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        slug: `this-slug-must-be-changed-from-${1 + maxSlugLength}-to-${maxSlugLength}-bytes`.padEnd(
          1 + maxSlugLength,
          's',
        ),
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: `this-slug-must-be-changed-from-${1 + maxSlugLength}-to-${maxSlugLength}-bytes`.padEnd(
          maxSlugLength,
          's',
        ),
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "slug" containing special characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        slug: 'slug-não-pode-ter-caracteres-especiais',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"slug" está no formato errado.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing Null value', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        slug: null,
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"slug" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing the same value of another content (same user, both "published" status)', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      await contentsRequestBuilder.post({
        title: 'Conteúdo existente',
        body: 'Conteúdo existente',
        slug: 'conteudo-existente',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Conteúdo existente',
        body: 'Outro body',
        slug: 'conteudo-existente',
        status: 'published',
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" com começo diferente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('Content with "slug" containing the same value of another content (same user, one with "draft" and the other "published" status)', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      await contentsRequestBuilder.post({
        title: 'Conteúdo existente',
        body: 'Conteúdo existente',
        slug: 'conteudo-existente',
        status: 'draft',
      });

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Conteúdo existente',
        body: 'Outro body',
        slug: 'conteudo-existente',
        status: 'published',
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" com começo diferente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('Content with "slug" containing the same value of another content (same user, one with "published" and the other "deleted" status)', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: firstContent } = await contentsRequestBuilder.post({
        title: 'Conteúdo existente',
        body: 'Conteúdo existente',
        slug: 'conteudo-existente',
        status: 'published',
      });

      await orchestrator.updateContent(firstContent.id, {
        status: 'deleted',
      });

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Conteúdo existente',
        body: 'Outro body',
        slug: 'conteudo-existente',
        status: 'published',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'conteudo-existente',
        title: 'Conteúdo existente',
        body: 'Outro body',
        status: 'published',
        type: 'content',
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        owner_username: defaultUser.username,
      });

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.published_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "slug" with trailing hyphen', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        slug: 'slug-with-trailing-hyphen---',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'slug-with-trailing-hyphen',
        title: 'Mini curso de Node.js',
        body: 'Instale o Node.js',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "title" containing a blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: '',
        body: 'Qualquer coisa.',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"title" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test(`Content with "title" containing more than ${maxTitleLength} characters`, async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: `Este título possui ${1 + maxTitleLength} caracteres`.padEnd(1 + maxTitleLength, 's'),
        body: 'Qualquer coisa.',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(`"title" deve conter no máximo ${maxTitleLength} caracteres.`);
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test(`Content with "title" containing ${maxTitleLength} characters but more than ${maxTitleLength} bytes`, async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title:
          `Este título possui ${maxTitleLength} caracteres ocupando ${1 + maxTitleLength} bytes e deve com 100% de certeza gerar um slug limitado a ${maxSlugLength} bytes`.padEnd(
            maxTitleLength,
            's',
          ),
        body: 'Instale o Node.js',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: `este-titulo-possui-${maxTitleLength}-caracteres-ocupando-${1 + maxTitleLength}-bytes-e-deve-com-100-por-cento-de-certeza-gerar-um-slug-limitado-a-${maxSlugLength}-bytes`.padEnd(
          maxSlugLength,
          's',
        ),
        title:
          `Este título possui ${maxTitleLength} caracteres ocupando ${1 + maxTitleLength} bytes e deve com 100% de certeza gerar um slug limitado a ${maxSlugLength} bytes`.padEnd(
            maxTitleLength,
            's',
          ),
        body: 'Instale o Node.js',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "title" containing Braille Pattern Blank Unicode Character', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: '\u2800 Braille Pattern Blank Unicode Character \u2800',
        body: 'Instale o Node.js',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'braille-pattern-blank-unicode-character',
        title: 'Braille Pattern Blank Unicode Character',
        body: 'Instale o Node.js',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test(`Content with "title" containing special characters occupying more than ${maxTitleLength} bytes`, async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: '♥'.repeat(maxTitleLength),
        body: `The title is ${maxTitleLength} characters but 765 bytes and the slug should only be ${maxSlugLength} bytes`,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: ''.padEnd(maxSlugLength, '4pml'),
        title: '♥'.repeat(maxTitleLength),
        body: `The title is ${maxTitleLength} characters but 765 bytes and the slug should only be ${maxSlugLength} bytes`,
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "title" containing untrimmed values', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: ' Título válido, mas com espaços em branco no início e no fim ',
        body: 'Qualquer coisa.',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-valido-mas-com-espacos-em-branco-no-inicio-e-no-fim',
        title: 'Título válido, mas com espaços em branco no início e no fim',
        body: 'Qualquer coisa.',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "title" containing unescaped characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\\o/'`,
        body: 'Qualquer coisa.',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'tab-e-news-conteudos-com-valor-strong-concreto-strong-e-massa-participe-o',
        title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\\o/'`,
        body: 'Qualquer coisa.',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "status" set to "draft"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Deveria criar um conteúdo com status "draft".',
        body: 'Qualquer coisa.',
        status: 'draft',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'deveria-criar-um-conteudo-com-status-draft',
        title: 'Deveria criar um conteúdo com status "draft".',
        body: 'Qualquer coisa.',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "status" set to "published"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Deveria criar um conteúdo com status "published".',
        body: 'E isso vai fazer ter um "published_at" preenchido automaticamente.',
        status: 'published',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'deveria-criar-um-conteudo-com-status-published',
        title: 'Deveria criar um conteúdo com status "published".',
        body: 'E isso vai fazer ter um "published_at" preenchido automaticamente.',
        status: 'published',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.published_at)).not.toBeNaN();
    });

    test('Content with "status" set to "deleted"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Deveria negar a criação de um conteúdo direto em "deleted".',
        body: 'Não faz sentido criar conteúdos deletados.',
        status: 'deleted',
      });

      expect(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Não é possível criar um novo conteúdo diretamente com status "deleted".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:INVALID_STATUS',
        key: 'status',
        type: 'any.only',
      });
    });

    test('Content with "status" set to "firewall"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Title.',
        body: 'Body',
        status: 'firewall',
      });

      expect(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Não é possível criar um novo conteúdo diretamente com status "firewall".',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:INVALID_STATUS',
        key: 'status',
        type: 'any.only',
      });
    });

    test('Content with "status" set to "non_existent_status"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Deveria negar.',
        body: 'Qualquer coisa.',
        status: 'inexisting_status',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"status" deve possuir um dos seguintes valores: "draft", "published", "deleted", "firewall".',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "status" set to Null', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Deveria negar.',
        body: 'Qualquer coisa.',
        status: null,
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"status" deve possuir um dos seguintes valores: "draft", "published", "deleted", "firewall".',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "status" set a blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Deveria negar.',
        body: 'Qualquer coisa.',
        status: '',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"status" deve possuir um dos seguintes valores: "draft", "published", "deleted", "firewall".',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a valid HTTP URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'TabNews',
        body: 'Somos pessoas brutalmente exatas e empáticas, simultaneamente.',
        source_url: 'http://www.tabnews.com.br/',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'tabnews',
        title: 'TabNews',
        body: 'Somos pessoas brutalmente exatas e empáticas, simultaneamente.',
        status: 'draft',
        type: 'content',
        source_url: 'http://www.tabnews.com.br/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "source_url" containing a valid HTTPS URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'TabNews: Onde Tudo Começou',
        body: 'Aqui você vai encontrar POCs que foram criadas pela turma no início do projeto.',
        source_url: 'https://www.tabnews.com.br/museu',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'tabnews-onde-tudo-comecou',
        title: 'TabNews: Onde Tudo Começou',
        body: 'Aqui você vai encontrar POCs que foram criadas pela turma no início do projeto.',
        status: 'draft',
        type: 'content',
        source_url: 'https://www.tabnews.com.br/museu',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "source_url" containing a valid long TLD', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Um baita de um Top-Level Domain',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
        source_url: 'http://nic.xn--vermgensberatung-pwb/',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'um-baita-de-um-top-level-domain',
        title: 'Um baita de um Top-Level Domain',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
        status: 'draft',
        type: 'content',
        source_url: 'http://nic.xn--vermgensberatung-pwb/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "source_url" containing a valid short URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'URL bem curta',
        body: 'Por exemplo o encurtador do Telegram',
        source_url: 'https://t.me',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'url-bem-curta',
        title: 'URL bem curta',
        body: 'Por exemplo o encurtador do Telegram',
        status: 'draft',
        type: 'content',
        source_url: 'https://t.me',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "source_url" containing a invalid short TLD', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Um Top-Level Domain menor que o permitido',
        body: 'TLDs precisam ter pelo menos dois caracteres',
        source_url: 'https://invalidtl.d',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a invalid long TLD', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Um Top-Level Domain maior que o permitido',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
        source_url: 'http://tl.dcomvinteecincocaracteres',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a not accepted Protocol', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Titulo',
        body: 'Corpo',
        source_url: 'ftp://www.tabnews.com.br',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" not containing a protocol', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Titulo',
        body: 'Corpo',
        source_url: 'www.tabnews.com.br',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing an incomplete URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Titulo',
        body: 'Corpo',
        source_url: 'https://lol.',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing query parameters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Titulo',
        body: 'Corpo',
        source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=old',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo',
        title: 'Titulo',
        body: 'Corpo',
        status: 'draft',
        type: 'content',
        source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=old',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "source_url" containing fragment component', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Titulo',
        body: 'Corpo',
        source_url: 'http://www.tabnews.com.br/#:~:text=TabNews,-Status',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo',
        title: 'Titulo',
        body: 'Corpo',
        status: 'draft',
        type: 'content',
        source_url: 'http://www.tabnews.com.br/#:~:text=TabNews,-Status',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('Content with "source_url" containing an empty String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Titulo',
        body: 'Corpo',
        source_url: '',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"source_url" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a Null value', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Titulo',
        body: 'Corpo',
        source_url: null,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo',
        title: 'Titulo',
        body: 'Corpo',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('"root" content with minimum valid data', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title:
          'Deveria conseguir! E o campo "slug" é opcional & 95,5% dos usuários não usam :) [áéíóú?@#$*<>|+-=.,;:_] <- (caracteres especiais)',
        body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'deveria-conseguir-e-o-campo-slug-e-opcional-e-95-5-por-cento-dos-usuarios-nao-usam-aeiou-caracteres-especiais',
        title:
          'Deveria conseguir! E o campo "slug" é opcional & 95,5% dos usuários não usam :) [áéíóú?@#$*<>|+-=.,;:_] <- (caracteres especiais)',
        body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const contentInDatabase = await database.query({
        text: 'SELECT * FROM contents WHERE id = $1',
        values: [responseBody.id],
      });

      expect(contentInDatabase.rows[0].path).toEqual([]);
    });

    test('"root" content with "title" containing custom slug special characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'under_score 5% é >= 1 e <= 10 email@dominio.com #item1,item2 a&b | a & b/mil',
        body: 'Body',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'under-score-5-por-cento-e-1-e-10-email-dominio-com-item1-item2-a-e-b-a-e-b-mil',
        title: 'under_score 5% é >= 1 e <= 10 email@dominio.com #item1,item2 a&b | a & b/mil',
        body: 'Body',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test('"root" content with "title" not declared', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        body: 'Não deveria conseguir, falta o "title".',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"title" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE');
    });

    test('"root" content with "title" containing Null value', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: null,
        body: 'Não deveria conseguir, falta o "title".',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"title" é um campo obrigatório.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE');
    });

    test('"child" content with minimum valid data', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: rootContent } = await contentsRequestBuilder.post({
        title: 'Conteúdo raiz',
        body: 'Body',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.post({
        body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
        parent_id: rootContent.id,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: responseBody.slug,
        title: null,
        body: 'Deveria conseguir, pois atualmente todos os usuários recebem todas as features relacionadas a "content".',
        status: 'draft',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.slug)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const contentInDatabase = await database.query({
        text: 'SELECT * FROM contents WHERE id = $1',
        values: [responseBody.id],
      });

      expect(contentInDatabase.rows[0].path).toEqual([rootContent.id]);
    });

    test('"child" content with "title" containing Null value', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

      const defaultUser = await contentsRequestBuilder.buildUser();
      const { responseBody: rootContent } = await contentsRequestBuilder.post({
        title: 'Conteúdo raiz',
        body: 'Body',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: null,
        body: 'Deveria criar um slug com UUID V4',
        parent_id: rootContent.id,
        status: 'published',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: responseBody.slug,
        title: null,
        body: 'Deveria criar um slug com UUID V4',
        status: 'published',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.slug)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.published_at)).not.toBeNaN();
    });

    test('"child" content with "title"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { responseBody: rootContent } = await contentsRequestBuilder.post({
        title: 'Conteúdo raiz',
        body: 'Body',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.post({
        title: 'Título em um child content! O que vai acontecer?',
        body: 'Deveria criar um slug baseado no "title"',
        parent_id: rootContent.id,
        status: 'published',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent.id,
        slug: 'titulo-em-um-child-content-o-que-vai-acontecer',
        title: 'Título em um child content! O que vai acontecer?',
        body: 'Deveria criar um slug baseado no "title"',
        status: 'published',
        type: 'content',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deleted_at: null,
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.published_at)).not.toBeNaN();
    });

    test('"child" content with "parent_id" containing a Number', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        body: 'Não deveria conseguir, pois o "parent_id" abaixo está num formato errado',
        parent_id: 123456,
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"parent_id" deve ser do tipo String.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('"child" content with "parent_id" containing a blank string', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        body: 'Não deveria conseguir, pois o "parent_id" abaixo está num formato errado',
        parent_id: '',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"parent_id" não pode estar em branco.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('"child" content with "parent_id" containing a malformatted UUIDV4', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        body: 'Não deveria conseguir, pois o "parent_id" abaixo está num formato errado',
        parent_id: 'isso não é um UUID válido',
      });

      expect(response.status).toBe(400);
      expect(responseBody.status_code).toBe(400);
      expect(responseBody.name).toBe('ValidationError');
      expect(responseBody.message).toBe('"parent_id" deve possuir um token UUID na versão 4.');
      expect(responseBody.action).toBe('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
      expect(responseBody.error_location_code).toBe('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('"child" content with "parent_id" that does not exists', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.post({
        body: 'Não deveria conseguir, pois o "parent_id" aqui embaixo não existe.',
        parent_id: 'fe2e20f5-9296-45ea-9a0f-401866819b9e',
      });

      expect(response.status).toBe(400);
      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: 'Você está tentando criar um comentário em um conteúdo que não existe.',
        action: 'Utilize um "parent_id" que aponte para um conteúdo existente.',
        error_location_code: 'MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND',
        key: 'parent_id',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    describe('Notifications', () => {
      test('Create "root" content', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        await contentsRequestBuilder.buildUser();

        const { response } = await contentsRequestBuilder.post({
          title: 'Usuário não deveria receber email de notificação',
          body: 'Ele não deveria ser notificado sobre suas próprias criações',
          status: 'published',
        });

        const getLastEmail = await orchestrator.getLastEmail();

        expect(response.status).toBe(201);
        expect(getLastEmail).toBeNull();
      });

      test('My "root" content replied by myself', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Novamente, não deveria receber notificação',
          body: 'Continua não sendo notificado sobre suas próprias criações',
          parent_id: rootContent.id,
          status: 'published',
        });

        const getLastEmail = await orchestrator.getLastEmail();

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(rootContent.id);
        expect(getLastEmail).toBeNull();
      });

      test('My "root" content with short "title" replied by other user', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const firstUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Título curto do conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Autor do `parent_id` deve receber notificação avisando que eu respondi o conteúdo dele.',
          parent_id: rootContent.id,
          status: 'published',
        });

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${secondUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(rootContent.id);
        expect(getLastEmail.recipients[0].includes(firstUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(`"${secondUser.username}" comentou em "Título curto do conteúdo raiz"`);
        expect(getLastEmail.text).toContain(firstUser.username);
        expect(getLastEmail.html).toContain(firstUser.username);
        expect(getLastEmail.text).toContain(secondUser.username);
        expect(getLastEmail.html).toContain(secondUser.username);
        expect(getLastEmail.text).toContain(rootContent.title);
        expect(getLastEmail.html).toContain(rootContent.title);
        expect(getLastEmail.text).toContain('respondeu à sua publicação');
        expect(getLastEmail.html).toContain('respondeu à sua publicação');
        expect(getLastEmail.text).toContain(childContentUrl);
        expect(getLastEmail.html).toContain(childContentUrl);
      });

      test('My "root" content with long "title" replied by other user', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const firstUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Título longo do conteúdo raiz, deveria cortar o título para caber título no email',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Autor do `parent_id` deve receber notificação avisando que eu respondi o conteúdo dele.',
          parent_id: rootContent.id,
          status: 'published',
        });

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${secondUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(rootContent.id);
        expect(getLastEmail.recipients[0].includes(firstUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(
          `"${secondUser.username}" comentou em "Título longo do conteúdo raiz, deveria cortar o título ..."`,
        );
        expect(getLastEmail.text).toContain(rootContent.title);
        expect(getLastEmail.html).toContain(rootContent.title);
        expect(getLastEmail.text).toContain(`Olá, ${firstUser.username}`);
        expect(getLastEmail.html).toContain(`Olá, ${firstUser.username}`);
        expect(getLastEmail.text).toContain(`"${secondUser.username}" respondeu à sua publicação`);
        expect(getLastEmail.html).toContain(secondUser.username);
        expect(getLastEmail.html).toContain('respondeu à sua publicação');
        expect(getLastEmail.text).toContain(childContentUrl);
        expect(getLastEmail.html).toContain(childContentUrl);
      });

      test('My "child" content replied by other user', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const firstUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Testando resposta ao conteúdo child',
          body: 'Body.',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();

        const { responseBody: childContentFromSecondUser } = await contentsRequestBuilder.post({
          parent_id: rootContent.id,
          body: 'Este conteúdo será respondido pelo "firstUser" no passo seguinte.',
          status: 'published',
        });

        await contentsRequestBuilder.setUser(firstUser);

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Este conteúdo deverá disparar uma notificação ao "secondUser',
          parent_id: childContentFromSecondUser.id,
          status: 'published',
        });

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${firstUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(childContentFromSecondUser.id);
        expect(getLastEmail.recipients[0].includes(secondUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(`"${firstUser.username}" comentou em "Testando resposta ao conteúdo child"`);
        expect(getLastEmail.text).toContain(`Olá, ${secondUser.username}`);
        expect(getLastEmail.html).toContain(`Olá, ${secondUser.username}`);
        expect(getLastEmail.text).toContain(rootContent.title);
        expect(getLastEmail.html).toContain(rootContent.title);
        expect(getLastEmail.text).toContain(`"${firstUser.username}" respondeu ao seu comentário na publicação`);
        expect(getLastEmail.html).toContain(firstUser.username);
        expect(getLastEmail.html).toContain('respondeu ao seu comentário na publicação');
        expect(getLastEmail.text).toContain(childContentUrl);
        expect(getLastEmail.html).toContain(childContentUrl);
      });

      test('My "child" content replied by other user, but "root" with "deleted" status', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const firstUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Testando resposta ao conteúdo child',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();

        const { responseBody: childContentFromSecondUser } = await contentsRequestBuilder.post({
          parent_id: rootContent.id,
          body: 'Este conteúdo será respondido pelo "firstUser" no passo seguinte.',
          status: 'published',
        });

        await orchestrator.updateContent(rootContent.id, {
          status: 'deleted',
        });

        await contentsRequestBuilder.setUser(firstUser);

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Este conteúdo deverá disparar uma notificação ao "secondUser',
          parent_id: childContentFromSecondUser.id,
          status: 'published',
        });

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${firstUser.username}/${responseBody.slug}`;

        expect(response.status).toBe(201);
        expect(responseBody.parent_id).toBe(childContentFromSecondUser.id);
        expect(getLastEmail.recipients[0].includes(secondUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(`"${firstUser.username}" comentou em "[Não disponível]"`);
        expect(getLastEmail.text).toContain(`Olá, ${secondUser.username}`);
        expect(getLastEmail.html).toContain(`Olá, ${secondUser.username}`);
        expect(getLastEmail.text).not.toContain(rootContent.title);
        expect(getLastEmail.html).not.toContain(rootContent.title);
        expect(getLastEmail.text).toContain(
          `"${firstUser.username}" respondeu ao seu comentário na publicação "[Não disponível]"`,
        );
        expect(getLastEmail.html).toContain(firstUser.username);
        expect(getLastEmail.html).toContain('respondeu ao seu comentário na publicação');
        expect(getLastEmail.html).toContain('[Não disponível]');
        expect(getLastEmail.text).toContain(childContentUrl);
        expect(getLastEmail.html).toContain(childContentUrl);
      });

      test('My "root" content replied by other user (with "notifications" disabled)', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const userRequestBuilder = new RequestBuilder('/api/v1/user');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');

        const firstUser = await contentsRequestBuilder.buildUser();
        await userRequestBuilder.setUser(firstUser);
        await usersRequestBuilder.setUser(firstUser);

        // 1) CHECK IF BY DEFAULT FIRST USER HAS `notifications` ENABLED
        const { responseBody: userGetResponseCheck1Body } = await userRequestBuilder.get();

        expect(userGetResponseCheck1Body.notifications).toBe(true);

        // 2) DISABLE NOTIFICATIONS FOR FIRST USER
        const { response: userPatchResponse1 } = await usersRequestBuilder.patch(`/${firstUser.username}`, {
          notifications: false,
        });

        expect(userPatchResponse1.status).toBe(200);

        const { responseBody: userGetResponseCheck2Body } = await userRequestBuilder.get();

        expect(userGetResponseCheck2Body.notifications).toBe(false);

        // 3) CREATE A CONTENT WITH FIRST USER
        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Testando sistema de notificação',
          body: 'Body',
          status: 'published',
        });

        // 4) REPLY TO CONTENT WITH SECOND USER
        const { response: contentResponse1 } = await contentsRequestBuilder.post({
          body: 'Autor do `parent_id` NÃO deve receber notificação avisando que eu respondi o conteúdo dele.',
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(contentResponse1.status).toBe(201);

        // 5) CHECK IF FIRST USER RECEIVED ANY EMAIL
        const getLastEmail1 = await orchestrator.getLastEmail();
        expect(getLastEmail1).toBeNull();

        // 6) ENABLE NOTIFICATIONS FOR FIRST USER
        const { response: userPatchResponse2 } = await usersRequestBuilder.patch(`/${firstUser.username}`, {
          notifications: true,
        });

        expect(userPatchResponse2.status).toBe(200);

        // 7) REPLY AGAIN TO CONTENT WITH SECOND USER
        const secondUser = await contentsRequestBuilder.buildUser();

        const { response: contentResponse2, responseBody: contentResponse2Body } = await contentsRequestBuilder.post({
          body: 'Agora sim autor do `parent_id` deveria receber notificação.',
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(contentResponse2.status).toBe(201);

        // 8) CHECK IF FIRST USER RECEIVED ANY EMAIL
        const getLastEmail2 = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${secondUser.username}/${contentResponse2Body.slug}`;

        expect(getLastEmail2.recipients[0].includes(firstUser.email)).toBe(true);
        expect(getLastEmail2.subject).toBe(`"${secondUser.username}" comentou em "Testando sistema de notificação"`);
        expect(getLastEmail2.text).toContain(firstUser.username);
        expect(getLastEmail2.text).toContain(secondUser.username);
        expect(getLastEmail2.text).toContain(rootContent.title);
        expect(getLastEmail2.text).toContain('respondeu à sua publicação');
        expect(getLastEmail2.text).toContain(childContentUrl);
        expect(getLastEmail2.html).toContain(firstUser.username);
        expect(getLastEmail2.html).toContain(secondUser.username);
        expect(getLastEmail2.html).toContain(rootContent.title);
        expect(getLastEmail2.html).toContain('respondeu à sua publicação');
        expect(getLastEmail2.html).toContain(childContentUrl);
      });
    });

    describe('Stream Response', () => {
      test('Reply with body containing 20k characters', async () => {
        await orchestrator.deleteAllEmails();

        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const firstUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Título do conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        contentsRequestBuilder.buildHeaders({
          Accept: 'application/json, application/x-ndjson',
        });
        const secondUser = await contentsRequestBuilder.buildUser();

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: '100 characters repeated in 200 linessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss\n'.repeat(
            200,
          ),
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(response.ok).toBe(true);
        expect(response.status).toBe(201);
        expect(response.headers.get('content-Type')).toBe('application/x-ndjson');

        const getLastEmail = await orchestrator.getLastEmail();

        const childContentUrl = `${orchestrator.webserverUrl}/${secondUser.username}/${responseBody.slug}`;

        expect(responseBody.body).toBe(
          '100 characters repeated in 200 linessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss\n'
            .repeat(200)
            .slice(0, 19999),
        );
        expect(responseBody.parent_id).toBe(rootContent.id);
        expect(getLastEmail.recipients[0].includes(firstUser.email)).toBe(true);
        expect(getLastEmail.subject).toBe(`"${secondUser.username}" comentou em "Título do conteúdo raiz"`);
        expect(getLastEmail.text).toContain(firstUser.username);
        expect(getLastEmail.html).toContain(firstUser.username);
        expect(getLastEmail.text).toContain(secondUser.username);
        expect(getLastEmail.html).toContain(secondUser.username);
        expect(getLastEmail.text).toContain(rootContent.title);
        expect(getLastEmail.html).toContain(rootContent.title);
        expect(getLastEmail.text).toContain('respondeu à sua publicação');
        expect(getLastEmail.html).toContain('respondeu à sua publicação');
        expect(getLastEmail.text).toContain(childContentUrl);
        expect(getLastEmail.html).toContain(childContentUrl);
      });
    });

    describe('TabCoins', () => {
      test('"root" content with "draft" status', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
        });

        expect(responseBody.tabcoins).toBe(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('"root" content with "published" status', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        await orchestrator.createPrestige(defaultUser.id);

        const { responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });

        expect(responseBody.tabcoins).toBe(1);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(2);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('"child" content with "draft" status', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Root',
          body: relevantBody,
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();

        const { responseBody } = await contentsRequestBuilder.post({
          body: relevantBody,
          parent_id: rootContent.id,
          status: 'draft',
        });

        expect(responseBody.tabcoins).toBe(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('"child" content with "published" status (same user)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        await orchestrator.createPrestige(defaultUser.id);

        // User will receive tabcoins for publishing a root content.
        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Root',
          body: relevantBody,
          status: 'published',
        });

        // But user will not receive additional tabcoins for
        // publishing a child content to itself.
        const { responseBody } = await contentsRequestBuilder.post({
          body: relevantBody,
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(responseBody.tabcoins).toBe(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(2);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('"child" content with "published" status (different user)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Root',
          body: relevantBody,
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id);

        const { responseBody } = await contentsRequestBuilder.post({
          body: relevantBody,
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(responseBody.tabcoins).toBe(1);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponseBody.tabcoins).toBe(2);
        expect(userResponseBody.tabcash).toBe(0);
      });
    });

    describe('Prestige', () => {
      test('should not be able to create "root" content with negative prestige by more than threshold', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -1, rootPrestigeDenominator: 2 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });

        expect(response.status).toBe(403);
        expect(responseBody.status_code).toBe(403);
        expect(responseBody.name).toBe('ForbiddenError');
        expect(responseBody.message).toBe(
          'Não é possível publicar porque há outras publicações mal avaliadas que ainda não foram excluídas.',
        );
        expect(responseBody.action).toBe(
          'Exclua seus conteúdos mais recentes que estiverem classificados como não relevantes.',
        );
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);
        expect(responseBody.error_location_code).toBe('MODEL:CONTENT:CREDIT_OR_DEBIT_TABCOINS:NEGATIVE_USER_EARNINGS');
      });

      test('should not be able to create "child" content with negative prestige by more than threshold', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id, { childPrestigeNumerator: -5, childPrestigeDenominator: 1 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Não deveria conseguir por possuir comentários mal avaliados.',
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(response.status).toBe(403);
        expect(responseBody.status_code).toBe(403);
        expect(responseBody.name).toBe('ForbiddenError');
        expect(responseBody.message).toBe(
          'Não é possível publicar porque há outras publicações mal avaliadas que ainda não foram excluídas.',
        );
        expect(responseBody.action).toBe(
          'Exclua seus conteúdos mais recentes que estiverem classificados como não relevantes.',
        );
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);
        expect(responseBody.error_location_code).toBe('MODEL:CONTENT:CREDIT_OR_DEBIT_TABCOINS:NEGATIVE_USER_EARNINGS');
      });

      test('Should be able to create "root" content with negative prestige at the threshold', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -9, rootPrestigeDenominator: 20 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'title',
          title: 'Title',
          body: relevantBody,
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should be able to create "child" content with negative prestige at the threshold', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id, { childPrestigeNumerator: -6, childPrestigeDenominator: 6 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Deveria conseguir mesmo com alguns comentários mal avaliados.',
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          slug: responseBody.slug,
          title: null,
          body: 'Deveria conseguir mesmo com alguns comentários mal avaliados.',
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: secondUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should not be able to earn tabcoins if it has less than threshold prestige in "root" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 1, rootPrestigeDenominator: 10 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'title',
          title: 'Title',
          body: relevantBody,
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should not be able to earn tabcoins if it has less than threshold prestige in "child" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id, { childPrestigeNumerator: -1 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Deve conseguir publicar, mas não deve ganhar TabCoins sem prestígio suficiente.',
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          slug: responseBody.slug,
          title: null,
          body: 'Deve conseguir publicar, mas não deve ganhar TabCoins sem prestígio suficiente.',
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: secondUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should be able to earn tabcoins if it has minimum prestige in "root" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 2, rootPrestigeDenominator: 10 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'title',
          title: 'Title',
          body: relevantBody,
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(1);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should be able to earn tabcoins if it has minimum prestige in "child" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id, { childPrestigeNumerator: 0, childPrestigeDenominator: 6 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: relevantBody,
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          slug: responseBody.slug,
          title: null,
          body: relevantBody,
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: secondUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponseBody.tabcoins).toBe(1);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should be able to publish even with a negative ad balance', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        vi.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        });

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const adContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Ad Title',
          status: 'published',
          body: relevantBody,
          type: 'ad',
        });

        await orchestrator.createRate(adContent, -999);

        vi.useRealTimers();

        const rootContent = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });
        expect.soft(rootContent.response.status).toBe(201);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);
        expect(userResponseBody.tabcoins).toBe(-999);
        expect(userResponseBody.tabcash).toBe(0);

        const otherUser = await orchestrator.createUser();
        const secondRootContent = await orchestrator.createContent({
          owner_id: otherUser.id,
          title: 'Title',
          body: 'Body',
          status: 'published',
        });

        const childContent = await contentsRequestBuilder.post({
          parent_id: secondRootContent.id,
          body: relevantBody,
          status: 'published',
        });
        expect.soft(childContent.response.status).toBe(201);

        const { responseBody: userResponseBody2 } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody2.tabcoins).toBe(-999);
        expect(userResponseBody2.tabcash).toBe(0);
      });

      test('Should not earn TabCoins even with a positive ad balance', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        vi.useFakeTimers({
          now: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        });

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const adContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Ad Title',
          status: 'published',
          body: relevantBody,
          type: 'ad',
        });

        await orchestrator.createRate(adContent, 999);

        vi.useRealTimers();

        const rootContent = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });
        expect.soft(rootContent.response.status).toBe(201);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(999);
        expect(userResponseBody.tabcash).toBe(0);

        const otherUser = await orchestrator.createUser();
        const secondRootContent = await orchestrator.createContent({
          owner_id: otherUser.id,
          title: 'Title',
          body: 'Body',
          status: 'published',
        });

        const childContent = await contentsRequestBuilder.post({
          parent_id: secondRootContent.id,
          body: relevantBody,
          status: 'published',
        });
        expect.soft(childContent.response.status).toBe(201);

        const { responseBody: userResponseBody2 } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody2.tabcoins).toBe(999);
        expect(userResponseBody2.tabcash).toBe(0);
      });
    });

    describe('No minimum amount of relevant words', () => {
      test('should not be able to create "root" content without prestige', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -6, rootPrestigeDenominator: 10 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: 'Body',
          status: 'published',
        });

        expect(response.status).toBe(403);
        expect(responseBody.status_code).toBe(403);
        expect(responseBody.name).toBe('ForbiddenError');
        expect(responseBody.message).toBe(
          'Não é possível publicar porque há outras publicações mal avaliadas que ainda não foram excluídas.',
        );
        expect(responseBody.action).toBe(
          'Exclua seus conteúdos mais recentes que estiverem classificados como não relevantes.',
        );
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);
        expect(responseBody.error_location_code).toBe('MODEL:CONTENT:CREDIT_OR_DEBIT_TABCOINS:NEGATIVE_USER_EARNINGS');
      });

      test('Should not be able to earn tabcoins in "root" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: 'Body with no minimum amount of relevant words',
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'title',
          title: 'Title',
          body: 'Body with no minimum amount of relevant words',
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 0,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should not be able to earn tabcoins in "child" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id);

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: 'Body with no minimum amount of relevant words',
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          slug: responseBody.slug,
          title: null,
          body: 'Body with no minimum amount of relevant words',
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 0,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: secondUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });
    });

    describe('With minimal amount of relevant words', () => {
      test('Should be able to earn tabcoins in "root" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 2, rootPrestigeDenominator: 10 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'title',
          title: 'Title',
          body: relevantBody,
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toBe(1);
        expect(userResponseBody.tabcash).toBe(0);
      });

      test('Should be able to earn tabcoins in "child" content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Conteúdo raiz',
          body: 'Body',
          status: 'published',
        });

        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id, { childPrestigeNumerator: 0, childPrestigeDenominator: 6 });

        const { response, responseBody } = await contentsRequestBuilder.post({
          body: relevantBody,
          parent_id: rootContent.id,
          status: 'published',
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          slug: responseBody.slug,
          title: null,
          body: relevantBody,
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 1,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: secondUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponseBody.tabcoins).toBe(1);
        expect(userResponseBody.tabcash).toBe(0);
      });
    });

    describe('With "type: ad"', () => {
      test('Should be able to create "ad" type content', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Ad title',
          body: 'Ad body',
          status: 'published',
          type: 'ad',
          source_url: 'https://www.tabnews.com.br',
        });

        expect.soft(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          parent_id: null,
          slug: 'ad-title',
          title: 'Ad title',
          body: 'Ad body',
          status: 'published',
          type: 'ad',
          source_url: 'https://www.tabnews.com.br',
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 0,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          tabcash: defaultTabCashForAdCreation,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test(`Should debit ${defaultTabCashForAdCreation} TabCash`, async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 1_000 + defaultTabCashForAdCreation,
        });

        const { response: contentResponse, responseBody: contentResponseBody } = await contentsRequestBuilder.post({
          title: 'Ad title',
          body: 'Ad body',
          status: 'published',
          type: 'ad',
        });

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect.soft(contentResponse.status).toBe(201);
        expect(contentResponseBody.tabcash).toBe(defaultTabCashForAdCreation);
        expect(userResponseBody.tabcash).toBe(1_000);
      });

      test(`Should not be able to create without enough TabCash`, async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation - 1,
        });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Ad title',
          body: 'Ad body',
          status: 'published',
          type: 'ad',
        });

        expect.soft(response.status).toBe(422);

        expect(responseBody).toStrictEqual({
          name: 'UnprocessableEntityError',
          message: 'Não foi possível criar a publicação.',
          action: `Você precisa de pelo menos ${defaultTabCashForAdCreation} TabCash para realizar esta ação.`,
          status_code: 422,
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
          error_location_code: 'MODEL:CONTENT:UPDATE_TABCASH:NOT_ENOUGH',
        });

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcash).toBe(defaultTabCashForAdCreation - 1);
      });

      test('Should not be able to create with "parent_id"', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const { responseBody: rootContent } = await contentsRequestBuilder.post({
          title: 'Root title',
          body: 'Root body',
          status: 'published',
        });

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Ad title',
          body: 'Ad body',
          status: 'published',
          type: 'ad',
          parent_id: rootContent.id,
        });

        expect.soft(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          slug: 'ad-title',
          title: 'Ad title',
          body: 'Ad body',
          status: 'published',
          type: 'content',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deleted_at: null,
          tabcoins: 0,
          tabcoins_credit: 0,
          tabcoins_debit: 0,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test('Should not credit TabCoins to the user', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 2, rootPrestigeDenominator: 10 });

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const { response: contentResponse, responseBody: contentResponseBody } = await contentsRequestBuilder.post({
          title: 'Title',
          body: relevantBody,
          status: 'published',
          type: 'ad',
        });

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect.soft(contentResponse.status).toBe(201);
        expect(contentResponseBody.tabcoins).toBe(1);
        expect(contentResponseBody.type).toBe('ad');
        expect(userResponseBody.tabcoins).toBe(0);
        expect(userResponseBody.tabcash).toBe(0);
      });
    });

    describe('With invalid "type"', () => {
      test('Should not be able to POST with invalid "type"', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const defaultUser = await contentsRequestBuilder.buildUser();

        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: defaultTabCashForAdCreation,
        });

        const { response, responseBody } = await contentsRequestBuilder.post({
          title: 'Ad title',
          body: 'Ad body',
          status: 'published',
          type: 'invalid_type',
        });

        expect.soft(response.status).toBe(400);

        expect(responseBody).toStrictEqual({
          name: 'ValidationError',
          message: '"type" deve possuir um dos seguintes valores: "content", "ad".',
          action: 'Ajuste os dados enviados e tente novamente.',
          status_code: 400,
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
          error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
          key: 'type',
          type: 'any.only',
        });
      });
    });
  });
});
