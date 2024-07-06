import { version as uuidVersion } from 'uuid';

import user from 'models/user';
import { maxSlugLength, maxTitleLength } from 'tests/constants-for-tests';
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
        bid: 4,
        budget: 44,
      });

      expect(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "create:ads".',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('User without "create:ads" feature', () => {
    test('sponsored content with valid data', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser({ without: ['create:ads'] });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'By user without permission',
        body: 'Body',
        bid: 5,
        budget: 30,
      });

      expect(response.status).toBe(403);

      expect(responseBody).toStrictEqual({
        status_code: 403,
        name: 'ForbiddenError',
        message: 'Usuário não pode executar esta operação.',
        action: 'Verifique se este usuário possui a feature "create:ads".',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });
  });

  describe('Default user', () => {
    test('sponsored content without "body"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'No body',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "body" containing an empty string', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Empty body',
        body: '',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "body" containing an empty markdown', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

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
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "slug" containing an empty string', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Blank slug',
        body: 'Body',
        slug: '',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content without "title"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        body: 'Body.',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "title" null', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: null,
        body: 'Body.',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "title" containing an empty string', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: '',
        body: 'Body.',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "title" containing more than 255 characters', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'T'.repeat(256),
        body: 'Body.',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

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
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "link" containing an empty string', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Empty link',
        body: 'Body',
        link: '',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"link" não pode estar em branco.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'link',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.empty',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "link" containing an unaccepted protocol', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'FTP protocol',
        body: 'Body',
        link: 'ftp://www.tabnews.com.br',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"link" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'link',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.pattern.base',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with "link" without a protocol', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'No protocol',
        body: 'Body',
        link: 'www.tabnews.com.br',
        bid: 2,
        budget: 50,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"link" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'link',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'string.pattern.base',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content without "budget"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'No "budget"',
        body: 'Body',
        bid: 3,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"budget" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'budget',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'any.required',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with zero "budget"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Zero "budget"',
        body: 'Body',
        bid: 5,
        budget: 0,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"budget" deve possuir um valor mínimo de 1.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'budget',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'number.min',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content without "bid"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'No "bid"',
        body: 'Body',
        budget: 10,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"bid" é um campo obrigatório.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'bid',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'any.required',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with zero "bid"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Zero "bid"',
        body: 'Body',
        bid: 0,
        budget: 30,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"bid" deve possuir um valor mínimo de 1.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'bid',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'number.min',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with invalid "deactivated_at"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Invalid deactivated_at date',
        body: 'Body',
        bid: 1,
        budget: 1,
        deactivated_at: 'date',
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: '"deactivated_at" deve conter uma data válida.',
        action: 'Ajuste os dados enviados e tente novamente.',
        key: 'deactivated_at',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:VALIDATOR:FINAL_SCHEMA',
        type: 'date.base',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with a "deactivated_at" date that has already passed', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Deactivates in the past',
        body: 'Body',
        bid: 1,
        budget: 1,
        deactivated_at: '2024-04-30T10:22:33.000Z',
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: 'A data de desativação não pode ser no passado.',
        action: 'Utilize uma data de desativação no futuro.',
        key: 'deactivated_at',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:SPONSORED_CONTENT:VALIDATE_DEACTIVATED_AT:DATE_IN_PAST',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with valid "bid" higher than "budget"', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      await sponsoredContentsRequestBuilder.buildUser();

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: '"Bid" higher than "budget"',
        body: 'Body',
        bid: 10,
        budget: 9,
      });

      expect(response.status).toBe(400);

      expect(responseBody).toStrictEqual({
        status_code: 400,
        name: 'ValidationError',
        message: 'O lance não pode ser maior do que o orçamento.',
        action: 'Diminua o lance ou aumente o orçamento.',
        key: 'bid',
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:SPONSORED_CONTENT:VALIDATE_BID_AND_BUDGET:BID_HIGHER_THAN_BUDGET',
      });
      expect(uuidVersion(responseBody.error_id)).toBe(4);
      expect(uuidVersion(responseBody.request_id)).toBe(4);
    });

    test('sponsored content with valid data', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
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
        deactivated_at: tomorrow.toISOString(),
        bid: 9,
        budget: 9,
        link: 'https://curso.dev/',
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'first-valid-sponsored-content',
        title: 'First valid sponsored content',
        body: 'First body',
        link: 'https://curso.dev/',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        activated_at: responseBody.activated_at,
        deactivated_at: tomorrow.toISOString(),
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.activated_at)).not.toBe(NaN);
    });

    test(`sponsored content with "slug" containing more than ${maxSlugLength} bytes`, async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 300,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: `Slug with more than ${maxSlugLength} bytes`,
        body: 'Sponsored content body',
        slug: `this-slug-must-be-changed-from-${1 + maxSlugLength}-to-${maxSlugLength}-bytes`.padEnd(
          1 + maxSlugLength,
          's',
        ),
        bid: 10,
        budget: 300,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: `this-slug-must-be-changed-from-${1 + maxSlugLength}-to-${maxSlugLength}-bytes`.padEnd(
          maxSlugLength,
          's',
        ),
        title: `Slug with more than ${maxSlugLength} bytes`,
        body: 'Sponsored content body',
        link: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        activated_at: responseBody.activated_at,
        deactivated_at: null,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.activated_at)).not.toBe(NaN);
    });

    test(`sponsored content with "title" containing special characters occupying more than ${maxTitleLength} bytes`, async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 300,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: '♥'.repeat(maxTitleLength),
        body: `The title is ${maxTitleLength} characters but ${maxTitleLength * 3} bytes and the slug should only be ${maxSlugLength} bytes`,
        bid: 5,
        budget: 300,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: ''.padStart(maxSlugLength, '4pml'),
        title: '♥'.repeat(255),
        body: `The title is ${maxTitleLength} characters but ${maxTitleLength * 3} bytes and the slug should only be ${maxSlugLength} bytes`,
        link: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        activated_at: responseBody.activated_at,
        deactivated_at: null,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.activated_at)).not.toBe(NaN);
    });

    test('sponsored content with "slug" containing the same value of another sponsored content from the same user', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 400,
      });

      const { response: firstResponse } = await sponsoredContentsRequestBuilder.post({
        title: 'First sponsored content',
        body: 'First body',
        slug: 'two-sponsored-contents-with-the-same-slug',
        bid: 50,
        budget: 200,
      });

      expect(firstResponse.status).toBe(201);

      const { response: secondResponse, responseBody: secondResponseBody } = await sponsoredContentsRequestBuilder.post(
        {
          title: 'Second sponsored content with the same slug as the first one',
          body: 'Second body',
          slug: 'two-sponsored-contents-with-the-same-slug',
          bid: 20,
          budget: 200,
        },
      );

      expect(secondResponse.status).toBe(400);

      expect(secondResponseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" com começo diferente.',
        status_code: 400,
        error_id: secondResponseBody.error_id,
        request_id: secondResponseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(secondResponseBody.error_id)).toBe(4);
      expect(uuidVersion(secondResponseBody.request_id)).toBe(4);
    });

    test('sponsored content with "slug" containing the same value of another sponsored content deactivated', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 300,
      });

      vi.useFakeTimers();

      const deactivateAt = new Date();
      deactivateAt.setDate(deactivateAt.getTime() - 60 * 1000);

      const { response: firstResponse } = await sponsoredContentsRequestBuilder.post({
        title: 'Two sponsored contents with the same slug, but this one is deactivated',
        body: 'First body',
        slug: 'same-sponsored-content-slug-with-one-deactivated',
        bid: 10,
        budget: 130,
        owner_id: defaultUser.id,
        deactivated_at: deactivateAt,
      });

      expect(firstResponse.status).toBe(201);

      vi.advanceTimersByTime(60 * 1000);

      const { response: secondResponse, responseBody: secondResponseBody } = await sponsoredContentsRequestBuilder.post(
        {
          title: 'Two sponsored contents with the same slug, where the first is deactivated',
          body: 'Second body',
          slug: 'same-sponsored-content-slug-with-one-deactivated',
          bid: 5,
          budget: 170,
        },
      );

      vi.useRealTimers();

      expect(secondResponse.status).toBe(400);

      expect(secondResponseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'O conteúdo enviado parece ser duplicado.',
        action: 'Utilize um "title" ou "slug" com começo diferente.',
        status_code: 400,
        error_id: secondResponseBody.error_id,
        request_id: secondResponseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
        key: 'slug',
      });
      expect(uuidVersion(secondResponseBody.error_id)).toBe(4);
      expect(uuidVersion(secondResponseBody.request_id)).toBe(4);
    });

    test('sponsored content with "slug" containing the same value of a content from the same user', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 200,
      });

      await orchestrator.createContent({
        title: 'A normal content (and a sponsored content will use the same slug)',
        body: 'First body',
        slug: 'duplicate-content-and-sponsored-content',
        status: 'published',
        owner_id: defaultUser.id,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'A sponsored content with the same slug of a normal content',
        body: 'Second body',
        slug: 'duplicate-content-and-sponsored-content',
        bid: 150,
        budget: 200,
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

    test('sponsored content with "slug" containing the same value of a deleted content from the same user', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 30,
      });

      const createdContent = await orchestrator.createContent({
        title: 'A content that will be deleted',
        body: 'Body',
        slug: 'same-slug-content-deleted',
        status: 'published',
        owner_id: defaultUser.id,
      });

      await orchestrator.updateContent(createdContent.id, { status: 'deleted' });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Sponsored content with the same slug of a deleted content',
        body: 'Body',
        slug: 'same-slug-content-deleted',
        bid: 7,
        budget: 30,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'same-slug-content-deleted',
        title: 'Sponsored content with the same slug of a deleted content',
        body: 'Body',
        link: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        activated_at: responseBody.activated_at,
        deactivated_at: null,
        owner_username: defaultUser.username,
      });
    });

    test('sponsored content with "link" containing query parameters', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 200,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'Title',
        body: 'Body',
        link: 'https://www.tabnews.com.br/api/v1/sponsored_contents?query=param',
        bid: 3,
        budget: 200,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'title',
        title: 'Title',
        body: 'Body',
        link: 'https://www.tabnews.com.br/api/v1/sponsored_contents?query=param',
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        activated_at: responseBody.activated_at,
        deactivated_at: null,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.activated_at)).not.toBe(NaN);
    });

    test('sponsored content with "title" containing custom slug special characters', async () => {
      const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
      const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
      await orchestrator.createBalance({
        balanceType: 'user:tabcash',
        recipientId: defaultUser.id,
        amount: 550,
      });

      const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
        title: 'title_1.000% @me!+#ã',
        body: 'Body',
        bid: 7,
        budget: 500,
      });

      expect(response.status).toBe(201);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        slug: 'title-1-000-por-cento-mea',
        title: 'title_1.000% @me!+#ã',
        body: 'Body',
        link: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        activated_at: responseBody.activated_at,
        deactivated_at: null,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.activated_at)).not.toBe(NaN);
    });

    describe('TabCash', () => {
      test('sponsored content without enough TabCash', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 100,
        });

        const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
          title: 'Not enough TabCash',
          body: 'Body.',
          bid: 10,
          budget: 101,
        });

        expect(response.status).toBe(422);

        expect(responseBody).toStrictEqual({
          name: 'UnprocessableEntityError',
          message: 'Não foi possível utilizar TabCash para criar esta publicação patrocinada.',
          action: 'Informe um valor menor ou acumule mais TabCash.',
          status_code: 422,
          error_id: responseBody.error_id,
          request_id: responseBody.request_id,
          error_location_code: 'MODEL:BALANCE:SPONSOR_CONTENT:NOT_ENOUGH',
        });
        expect(uuidVersion(responseBody.error_id)).toBe(4);
        expect(uuidVersion(responseBody.request_id)).toBe(4);
      });

      test('sponsored content updating user TabCash', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
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
          bid: 15,
          budget: 120,
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          slug: 'check-user-tabcash',
          title: 'Check user TabCash',
          body: 'Body',
          link: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          activated_at: responseBody.activated_at,
          deactivated_at: null,
          owner_username: defaultUser.username,
        });
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
        expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
        expect(Date.parse(responseBody.activated_at)).not.toBe(NaN);

        const updatedUser = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(updatedUser.tabcoins).toBe(initialTabcoins);
        expect(updatedUser.tabcash).toBe(130);
      });
    });

    describe('Prestige', () => {
      test('should be able to create a sponsored content with negative prestige by more than threshold', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 300,
        });
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: -1, rootPrestigeDenominator: 2 });

        const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
          title: 'With negative prestige',
          body: 'Relevant relevant relevant; user with negative prestige.',
          bid: 30,
          budget: 300,
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          slug: 'with-negative-prestige',
          title: 'With negative prestige',
          body: 'Relevant relevant relevant; user with negative prestige.',
          link: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          activated_at: responseBody.activated_at,
          deactivated_at: null,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
        expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
        expect(Date.parse(responseBody.activated_at)).not.toBe(NaN);

        const updatedUser = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(updatedUser.tabcoins).toBe(0);
        expect(updatedUser.tabcash).toBe(0);
      });

      test('should not earn TabCoins even if it has the minimum prestige in "root" content', async () => {
        const sponsoredContentsRequestBuilder = new RequestBuilder('/api/v1/sponsored_contents');
        const defaultUser = await sponsoredContentsRequestBuilder.buildUser();
        await orchestrator.createBalance({
          balanceType: 'user:tabcash',
          recipientId: defaultUser.id,
          amount: 185,
        });
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 2, rootPrestigeDenominator: 10 });

        const { response, responseBody } = await sponsoredContentsRequestBuilder.post({
          title: 'No TabCoins earnings',
          body: 'Sponsored content does not give TabCoins to the author, even if the content is relevant.',
          bid: 10,
          budget: 185,
        });

        expect(response.status).toBe(201);

        expect(responseBody).toStrictEqual({
          id: responseBody.id,
          owner_id: defaultUser.id,
          slug: 'no-tabcoins-earnings',
          title: 'No TabCoins earnings',
          body: 'Sponsored content does not give TabCoins to the author, even if the content is relevant.',
          link: null,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
          activated_at: responseBody.activated_at,
          deactivated_at: null,
          owner_username: defaultUser.username,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBe(NaN);
        expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);

        const updatedUser = await user.findOneById(defaultUser.id, { withBalance: true });
        expect(updatedUser.tabcoins).toBe(0);
        expect(updatedUser.tabcash).toBe(0);
      });
    });
  });
});
