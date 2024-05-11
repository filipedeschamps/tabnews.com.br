import { version as uuidVersion } from 'uuid';

import event from 'models/event';
import user from 'models/user';
import orchestrator from 'tests/orchestrator';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/sponsored_contents', () => {
  describe('Anonymous user', () => {
    test('sponsored content with valid data', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'By anonymous user',
        body: 'Body',
        tabcash: 44,
      });

      expect(response.status).toEqual(403);

      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "create:sponsored_content".',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('Default user', () => {
    test('sponsored content with valid data', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'By user without permission',
        body: 'Body',
        tabcash: 30,
      });

      expect(response.status).toEqual(403);

      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "create:sponsored_content".',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('User with "create:sponsored_content" feature', () => {
    const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');

    beforeAll(async () => {
      await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
    }, []);

    test('sponsored content without "body"', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'No body',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"body" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'body',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'any.required',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "body" containing an empty string', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Empty body',
        body: '',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"body" não pode estar em branco.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'body',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.empty',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "body" containing an empty markdown', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Empty markdown',
        body: `![](https://example.com/image.png)
              <div>\u00a0</div>
              <b>\u2800</b>
              <!-- some 
              comments -->
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
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: 'Markdown deve conter algum texto.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'body',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'markdown.empty',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "slug" containing an empty string', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Blank slug',
        body: 'Body',
        slug: '',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"slug" não pode estar em branco.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'slug',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.empty',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content without "title"', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        body: 'Body.',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"title" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'title',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'any.required',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "title" null', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: null,
        body: 'Body.',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"title" deve ser do tipo String.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'title',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.base',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "title" containing an empty string', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: '',
        body: 'Body.',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"title" não pode estar em branco.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'title',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.empty',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "title" containing more than 255 characters', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'T'.repeat(256),
        body: 'Body.',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"title" deve conter no máximo 255 caracteres.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'title',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.max',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "source_url" containing an empty string', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Empty source_url',
        body: 'Body',
        source_url: '',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"source_url" não pode estar em branco.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'source_url',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.empty',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "source_url" containing an unaccepted protocol', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'FTP protocol',
        body: 'Body',
        source_url: 'ftp://www.tabnews.com.br',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'source_url',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.pattern.base',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "source_url" not containing a protocol', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'No protocol',
        body: 'Body',
        source_url: 'www.tabnews.com.br',
        tabcash: 50,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'source_url',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.pattern.base',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content without "tabcash"', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'No TabCash',
        body: 'Body',
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"tabcash" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'tabcash',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'any.required',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with zero "tabcash"', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Zero TabCash',
        body: 'Body',
        tabcash: 0,
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"tabcash" deve possuir um valor mínimo de 1.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'tabcash',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'number.min',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with invalid "deactivate_at"', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Invalid deactivate_at date',
        body: 'Body',
        tabcash: 1,
        deactivate_at: 'date',
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"deactivate_at" deve conter uma data válida.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'deactivate_at',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'date.base',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('sponsored content with a "deactivate_at" date that has already passed', async () => {
      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Deactivates in the past',
        body: 'Body',
        tabcash: 1,
        deactivate_at: '2024-04-30T10:22:33.000Z',
      });

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: `"deactivate_at" não pode ser no passado.`,
        action: `Utilize uma data "deactivate_at" no futuro.`,
        key: 'deactivate_at',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:VALIDATE_DEACTIVATE_AT_ON_CREATE:DATE_IN_PAST',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });
  });

  describe('User with "create:sponsored_content" feature (dropAllTables beforeEach)', () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });

    test('sponsored content with valid data', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 100,
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'First valid sponsored content',
        body: 'First body',
        deactivate_at: tomorrow.toISOString(),
        tabcash: 100,
        source_url: 'https://curso.dev/',
      });

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'first-valid-sponsored-content',
        title: 'First valid sponsored content',
        body: 'First body',
        source_url: 'https://curso.dev/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deactivate_at: tomorrow.toISOString(),
        owner_username: defaultUser.username,
        tabcoins: 1,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);

      const allEvents = await event.findAll();
      const sponsoredContentCreatedEvent = allEvents[0];

      expect(allEvents).toHaveLength(1);

      expect(sponsoredContentCreatedEvent).toEqual({
        created_at: sponsoredContentCreatedEvent.created_at,
        id: sponsoredContentCreatedEvent.id,
        metadata: {
          id: responseBody.id,
        },
        originator_ip: '127.0.0.1',
        originator_user_id: defaultUser.id,
        type: 'create:sponsored_content',
      });
    });

    test('sponsored content with "slug" containing more than 226 bytes', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 300,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Slug with more than 226 bytes',
        body: 'Sponsored content body',
        slug: 'this-slug-must-be-changed-from-227-to-226-bytes'.padEnd(227, 's'),
        tabcash: 300,
      });

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'this-slug-must-be-changed-from-227-to-226-bytes'.padEnd(226, 's'),
        title: 'Slug with more than 226 bytes',
        body: 'Sponsored content body',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deactivate_at: null,
        owner_username: defaultUser.username,
        tabcoins: 1,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('sponsored content with "title" containing special characters occupying more than 226 bytes', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 300,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: '♥'.repeat(255),
        body: 'The title is 255 characters but 765 bytes and the slug should only be 226 bytes',
        tabcash: 300,
      });

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: ''.padStart(226, '4pml'),
        title: '♥'.repeat(255),
        body: 'The title is 255 characters but 765 bytes and the slug should only be 226 bytes',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deactivate_at: null,
        owner_username: defaultUser.username,
        tabcoins: 1,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('sponsored content with "slug" containing the same value of another content (same user, both "published" status)', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 400,
      });

      const { response: firstResponse } = await sponsoredContentsRequestBuilder.post({
        title: 'First sponsored content',
        body: 'First body',
        slug: 'repeated-slug',
        tabcash: 200,
      });

      expect(firstResponse.status).toEqual(201);

      const { response: secondResponse, responseBody: secondResponseBody } = await sponsoredContentsRequestBuilder.post(
        {
          title: 'Second sponsored content',
          body: 'Second body',
          slug: 'repeated-slug',
          tabcash: 200,
        },
      );

      expect(secondResponse.status).toEqual(400);

      expect(secondResponseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" diferente.',
        status_code: 400,
        error_id: secondResponseBody.error_id,
        request_id: secondResponseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(secondResponseBody.error_id)).toEqual(4);
      expect(uuidVersion(secondResponseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "slug" containing the same value of another sponsored content deactivated', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 300,
      });

      const deactivateAt = new Date();
      deactivateAt.setDate(deactivateAt.getTime() - 60 * 1000);

      const { response: firstResponse } = await sponsoredContentsRequestBuilder.post({
        title: 'First sponsored content',
        body: 'First body',
        slug: 'same-slug',
        tabcash: 130,
        owner_id: defaultUser.id,
        deactivate_at: deactivateAt,
      });

      expect(firstResponse.status).toEqual(201);

      const { response: secondResponse, responseBody: secondResponseBody } = await sponsoredContentsRequestBuilder.post(
        {
          title: 'Second sponsored content',
          body: 'Second body',
          slug: 'same-slug',
          tabcash: 170,
        },
      );

      expect(secondResponse.status).toEqual(400);

      expect(secondResponseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" diferente.',
        status_code: 400,
        error_id: secondResponseBody.error_id,
        request_id: secondResponseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(secondResponseBody.error_id)).toEqual(4);
      expect(uuidVersion(secondResponseBody.request_id)).toEqual(4);
    });

    test('sponsored content with "slug" containing the same value of a content', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 200,
      });

      await orchestrator.createContent({
        title: 'A normal content',
        body: 'First body',
        slug: 'my-content',
        status: 'published',
        owner_id: defaultUser.id,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'A sponsored content',
        body: 'Second body',
        slug: 'my-content',
        tabcash: 200,
      });

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

    test('sponsored content with "source_url" containing query parameters', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 200,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Title',
        body: 'Body',
        source_url: 'https://www.tabnews.com.br/api/v1/sponsored_contents?query=param',
        tabcash: 200,
      });

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'title',
        title: 'Title',
        body: 'Body',
        source_url: 'https://www.tabnews.com.br/api/v1/sponsored_contents?query=param',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deactivate_at: null,
        owner_username: defaultUser.username,
        tabcoins: 1,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('sponsored content with "title" containing custom slug special characters', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 550,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'title_1.000% @me!+#ã',
        body: 'Body',
        tabcash: 500,
      });

      expect(response.status).toEqual(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'title-1-000-por-cento-mea',
        title: 'title_1.000% @me!+#ã',
        body: 'Body',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: responseBody.published_at,
        deactivate_at: null,
        owner_username: defaultUser.username,
        tabcoins: 1,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
    });

    test('active sponsored content limit reached', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');

      const timesSuccessfully = 5;
      const hourInMillisecond = 60 * 60 * 1000;

      const deactivateAt = new Date();

      for (let i = 0; i < timesSuccessfully; i++) {
        deactivateAt.setDate(deactivateAt.getTime() + hourInMillisecond);

        const createdUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: createdUser.id,
          amount: 100,
        });

        const { response } = await sponsoredContentsRequestBuilder.post({
          title: `Sponsored content ${i}`,
          body: 'Body',
          tabcash: 100,
          deactivate_at: deactivateAt,
        });

        expect(response.status).toEqual(201);
      }

      const createdUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: createdUser.id,
        amount: 100,
      });

      const { response: responseError, responseBody: responseBodyError } = await sponsoredContentsRequestBuilder.post({
        title: 'Error',
        body: 'Body',
        tabcash: 100,
      });

      expect(responseError.status).toEqual(400);

      expect(responseBodyError).toStrictEqual({
        name: 'ValidationError',
        message: 'Não é possível criar uma nova publicação patrocinada.',
        action: 'Aguarde uma publicação patrocinada ser desativada para criar uma nova.',
        status_code: 400,
        error_id: responseBodyError.error_id,
        request_id: responseBodyError.request_id,
        error_location_code: 'MODEL:SPONSORED_CONTENT:CREATE:ACTIVE_LIMIT_REACHED',
      });
      expect(uuidVersion(responseBodyError.error_id)).toEqual(4);
      expect(uuidVersion(responseBodyError.request_id)).toEqual(4);
    });

    test('active sponsored content from the same user limit reached', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');

      const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });

      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 200,
      });

      const { response: response1 } = await sponsoredContentsRequestBuilder.post({
        title: 'Sponsored content #1',
        body: 'Body',
        tabcash: 100,
      });

      expect(response1.status).toEqual(201);

      const { response: responseError, responseBody: responseBodyError } = await sponsoredContentsRequestBuilder.post({
        title: 'Error',
        body: 'Body',
        tabcash: 100,
      });

      expect(responseError.status).toEqual(400);

      expect(responseBodyError).toStrictEqual({
        name: 'ValidationError',
        message: 'Não é possível criar uma nova publicação patrocinada.',
        action: 'Aguarde uma publicação patrocinada sua ser desativada para criar uma nova.',
        status_code: 400,
        error_id: responseBodyError.error_id,
        request_id: responseBodyError.request_id,
        error_location_code: 'MODEL:SPONSORED_CONTENT:CREATE:USER_ACTIVE_LIMIT_REACHED',
      });
      expect(uuidVersion(responseBodyError.error_id)).toEqual(4);
      expect(uuidVersion(responseBodyError.request_id)).toEqual(4);
    });

    describe('TabCash', () => {
      test('sponsored content without enough TabCash', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 100,
        });

        const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
          title: 'Not enough TabCash',
          body: 'Body.',
          tabcash: 101,
        });

        expect(response.status).toEqual(422);

        expect(responseBody).toStrictEqual({
          name: 'UnprocessableEntityError',
          message: `Não foi possível utilizar TabCash para patrocinar esta publicação.`,
          action: `Você não possui 101 TabCash disponível.`,
          status_code: 422,
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
          error_location_code: 'MODEL:BALANCE:SPONSOR_CONTENT:NOT_ENOUGH',
        });
        expect(uuidVersion(responseBody.error_id)).toEqual(4);
        expect(uuidVersion(responseBody.request_id)).toEqual(4);
      });

      test('sponsored content updating user TabCash', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 250,
        });

        const initialTabcoins = 270;
        await orchestrator.createBalance({
          balanceType: 'user:tabcoin',
          recipientId: defaultUser.id,
          amount: initialTabcoins,
        });

        const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
          title: 'Check user TabCash',
          body: 'Body',
          tabcash: 120,
        });

        expect(response.status).toEqual(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          slug: 'check-user-tabcash',
          title: 'Check user TabCash',
          body: 'Body',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deactivate_at: null,
          owner_username: defaultUser.username,
          tabcoins: 1,
        });
        expect(uuidVersion(responseBody.id)).toEqual(4);
        expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
        expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
        expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);

        const updatedUser = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(updatedUser.tabcoins).toEqual(initialTabcoins);
        expect(updatedUser.tabcash).toEqual(130);
      });
    });

    describe('Prestige', () => {
      test('should be able to create a sponsored content with negative prestige by more than threshold', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 300,
        });
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -1, rootPrestigeDenominator: 2 });

        const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
          title: 'With negative prestige',
          body: 'Relevant relevant relevant; user with negative prestige.',
          tabcash: 300,
        });

        expect(response.status).toEqual(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          slug: 'with-negative-prestige',
          title: 'With negative prestige',
          body: 'Relevant relevant relevant; user with negative prestige.',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deactivate_at: null,
          owner_username: defaultUser.username,
          tabcoins: 1,
        });

        expect(uuidVersion(responseBody.id)).toEqual(4);
        expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
        expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
        expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);

        const updatedUser = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(updatedUser.tabcoins).toEqual(0);
        expect(updatedUser.tabcash).toEqual(0);
      });

      test('should not earn TabCoins even if it has the minimum prestige in "root" content', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser({ with: ['create:sponsored_content'] });
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 185,
        });
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 2, rootPrestigeDenominator: 10 });

        const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
          title: 'No TabCoins earnings',
          body: 'Sponsored content does not give TabCoins to the author.',
          tabcash: 185,
        });

        expect(response.status).toEqual(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          slug: 'no-tabcoins-earnings',
          title: 'No TabCoins earnings',
          body: 'Sponsored content does not give TabCoins to the author.',
          source_url: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          published_at: responseBody.published_at,
          deactivate_at: null,
          owner_username: defaultUser.username,
          tabcoins: 1,
        });

        expect(uuidVersion(responseBody.id)).toEqual(4);
        expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
        expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);

        const updatedUser = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(updatedUser.tabcoins).toEqual(0);
        expect(updatedUser.tabcash).toEqual(0);
      });
    });
  });
});
