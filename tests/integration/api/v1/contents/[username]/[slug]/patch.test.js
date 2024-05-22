import { version as uuidVersion } from 'uuid';

import orchestrator from 'tests/orchestrator.js';
import RequestBuilder from 'tests/request-builder';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/contents/[username]/[slug]', () => {
  describe('Anonymous user', () => {
    test('Content with minimum valid data', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');

      const { response, responseBody } = await contentsRequestBuilder.patch('/someUsername/slug', {
        title: 'Anônimo tentando atualizar um conteúdo existente',
        body: 'Não deveria conseguir.',
      });

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const userWithoutFeature = await contentsRequestBuilder.buildUser({ without: ['update:content'] });

      const { response, responseBody } = await contentsRequestBuilder.patch(`/${userWithoutFeature.username}/slug`, {
        title: 'Usuário válido, tentando atualizar conteúdo na raiz do site.',
        body: 'Não deveria conseguir, pois não possui a feature "update:content".',
      });

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const userWithoutFeature = await contentsRequestBuilder.buildUser({ without: ['update:content'] });

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

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${userWithoutFeature.username}/${childContent.slug}`,
        {
          title: 'Usuário válido, tentando atualizar conteúdo "child".',
          body: 'Não deveria conseguir, pois não possui a feature "update:content".',
        },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      contentsRequestBuilder.buildHeaders({ 'Content-Type': undefined });
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.patch(`/${defaultUser.username}/slug`);

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with PATCH Body containing an invalid JSON string', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      contentsRequestBuilder.buildHeaders({ 'Content-Type': undefined });
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/slug`,
        'Texto corrido no lugar de um JSON',
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" enviado deve ser do tipo Object.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with PATCH Body containing an empty Object', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.patch(`/${defaultUser.username}/slug`, {});

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.patch(`/invalid-username/slug`, {});

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/%3Cscript%3Ealert%28%29%3Cscript%3E`,
        {},
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();

      const { response, responseBody } = await contentsRequestBuilder.patch(`/ThisUserDoesNotExists/slug`, {
        title: 'Primeiro usuário tentando atualizar o conteúdo do Segundo usuário',
        body: 'Não deveria conseguir',
      });

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const firstUser = await contentsRequestBuilder.buildUser();

      await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Conteúdo do primeiro usuário',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${firstUser.username}/esse-slug-nao-existe`,
        {
          title: 'Tentando atualizar um conteúdo próprio, mas errando o slug',
          body: 'Não deveria conseguir',
        },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();
      const secondUser = await orchestrator.createUser();

      const secondUserContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo do segundo usuário',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${secondUser.username}/${secondUserContent.slug}`,
        {
          title: 'Primeiro usuário tentando atualizar o conteúdo do Segundo usuário',
          body: 'Não deveria conseguir',
        },
      );

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para atualizar o conteúdo de outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "update:content:others".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual(
        'CONTROLLER:CONTENTS:PATCH:USER_CANT_UPDATE_CONTENT_FROM_OTHER_USER',
      );
    });

    test('Content with "owner_id" pointing to another user', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const firstUser = await contentsRequestBuilder.buildUser();
      const secondUser = await orchestrator.createUser();

      const firstUserContent = await orchestrator.createContent({
        owner_id: firstUser.id,
        title: 'Conteúdo do Primeiro Usuário antes do patch!',
        body: 'Body antes do patch!',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${firstUser.username}/${firstUserContent.slug}`,
        {
          title: 'Tentando atualizar o dono do conteúdo.',
          body: 'Campo "owner_id" da request deveria ser ignorado e pego através da sessão.',
          owner_id: secondUser.id,
        },
      );

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
        tabcoins: 0,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: firstUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(firstUserContent.published_at.toISOString());
      expect(responseBody.updated_at > firstUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "body" declared solely', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { body: 'Body novo' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with TabCoins credits and debits', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Title',
        body: 'Body',
      });

      await orchestrator.createRate(defaultUserContent, 3);
      await orchestrator.createRate(defaultUserContent, -2);

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { body: 'New body' },
      );

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'title',
        title: 'Title',
        body: 'New body',
        status: 'draft',
        source_url: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        published_at: null,
        deleted_at: null,
        tabcoins: 1,
        tabcoins_credit: 3,
        tabcoins_debit: -2,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "body" containing blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { body: '' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          body: `![](https://image-url.com/image.png)
            <div><a></a></div>`,
        },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Markdown deve conter algum texto.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title", "body" and "source_url" containing \\u0000 null characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Contendo caractere \u0000 proibido no Postgres',
        body: '\u0000Começando com caractere proibido no Postgres',
        source_url: 'https://\u0000teste-caractere.invalido/',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          title: '\u0000Começando com caractere proibido no Postgres',
          body: 'Terminando com caractere proibido no Postgres\u0000',
          source_url: 'https://teste-caractere.invalido/\u0000',
        },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
    });

    test('Content with "title" and "body" containing invalid characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: '\u2800Título começando com caracteres inválidos.',
        body: 'Texto começando com caracteres inválidos.',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          title: 'Título terminando com caracteres inválidos.\u200f',
          body: '\u2800Texto terminando com caracteres inválidos.\u200e',
        },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { body: 'A'.repeat(20001) },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { body: ' Espaço no início e no fim ' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { body: 'Espaço só no fim ' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "body" containing Null value', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { body: null },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"body" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" declared solely', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        slug: 'slug-velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { slug: 'slug-novo' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "slug" containing the same value of another content (same user, both "published" status)', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      // firstContent
      await orchestrator.createContent({
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

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${secondContent.slug}`,
        { slug: 'primeiro-conteudo' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      // firstContent
      await orchestrator.createContent({
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

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${secondContent.slug}`,
        { slug: 'primeiro-conteudo' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

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

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${secondContent.slug}`,
        { slug: 'primeiro-conteudo' },
      );

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'primeiro-conteudo',
        title: 'Segundo conteúdo',
        body: 'Segundo conteúdo',
        status: 'published',
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

      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
    });

    test('Content with "slug" containing a blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { slug: '' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"slug" não pode estar em branco.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "slug" containing more than 226 bytes', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          slug: 'this-slug-must-be-changed-from-227-to-226-bytes'.padEnd(227, 's'),
        },
      );

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'this-slug-must-be-changed-from-227-to-226-bytes'.padEnd(226, 's'),
        title: 'Título velho',
        body: 'Body velho',
        status: 'draft',
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

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "slug" containing special characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { slug: 'slug-não-pode-ter-caracteres-especiais' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { slug: null },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('"slug" deve ser do tipo String.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title" declared solely', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { title: 'Título novo' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "title" containing a blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { title: '' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      await orchestrator.updateContent(defaultUserContent.id, {
        status: 'deleted',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { title: 'Título novo' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        {
          title:
            'Este título possui 256 caracteressssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss',
        },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { title: null },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

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

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${childContent.slug}`,
        { title: null },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > childContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "title" containing untrimmed values', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { title: ' Título válido, mas com espaços em branco no início e no fim ' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "title" containing unescaped characters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\\o/'` },
      );

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: `Tab & News | Conteúdos com \n valor <strong>concreto</strong> e "massa"> participe! '\\o/'`,
        body: 'Body velho',
        status: 'draft',
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

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "draft" set to "draft"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { status: 'draft' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "draft" set to "published"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'draft',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { status: 'published' },
      );

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'titulo-velho',
        title: 'Título velho',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'published',
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

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "status" "published" set to "draft"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { status: 'draft' },
      );

      expect(response.status).toEqual(400);

      expect(responseBody).toStrictEqual({
        name: 'ValidationError',
        message: 'Não é possível alterar para rascunho um conteúdo já publicado.',
        action: 'Ajuste os dados enviados e tente novamente.',
        status_code: 400,
        error_id: responseBody.error_id,
        request_id: responseBody.request_id,
        error_location_code: 'MODEL:CONTENT:CHECK_STATUS_CHANGE:STATUS_ALREADY_PUBLISHED',
        key: 'status',
      });
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
    });

    test('Content with "status" "published" set to "deleted"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Title',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { status: 'deleted' },
      );

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: null,
        slug: 'title',
        title: 'Title',
        body: 'Body with relevant texts needs to contain a good amount of words',
        status: 'deleted',
        tabcoins: 1,
        tabcoins_credit: 0,
        tabcoins_debit: 0,
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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const originalContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Title',
        body: 'Body',
        status: 'published',
      });

      await contentsRequestBuilder.patch(`/${defaultUser.username}/${originalContent.slug}`, {
        status: 'deleted',
      });

      const { response: republishedResponse, responseBody: republishedResponseBody } =
        await contentsRequestBuilder.patch(`/${defaultUser.username}/${originalContent.slug}`, { status: 'published' });

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { status: 'inexisting_status' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"status" deve possuir um dos seguintes valores: "draft", "published", "deleted".',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "status" set to Null', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { status: null },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"status" deve possuir um dos seguintes valores: "draft", "published", "deleted".',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "status" set a blank String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { status: '' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"status" deve possuir um dos seguintes valores: "draft", "published", "deleted".',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a valid HTTP URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'http://www.tabnews.com.br/' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a valid HTTPS URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'https://www.tabnews.com.br/museu' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a valid long TLD', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar um baita de um Top-Level Domain',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'https://nic.xn--vermgensberatung-pwb/' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a valid short URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar URL bem curta',
        body: 'Por exemplo o encurtador do Telegram',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'https://t.me' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing a invalid short TLD', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar um Top-Level Domain menor que o permitido',
        body: 'TLDs precisam ter pelo menos dois caracteres',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'http://invalidtl.d' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a invalid long TLD', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Alterar um Top-Level Domain maior que o permitido',
        body: 'O maior TLD listado em http://data.iana.org/TLD/tlds-alpha-by-domain.txt possuía 24 caracteres',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'https://tl.dcomvinteecincocaracteres' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing a not accepted Protocol', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'ftp://www.tabnews.com.br' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" not containing a protocol', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'www.tabnews.com.br' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing an incomplete URL', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'https://lol.' },
      );

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual(
        '"source_url" deve possuir uma URL válida e utilizando os protocolos HTTP ou HTTPS.',
      );
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "source_url" containing query parameters', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'https://www.tabnews.com.br/api/v1/contents?strategy=old' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing fragment component', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: 'https://www.tabnews.com.br/#:~:text=TabNews,-Status' },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(null);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "source_url" containing an empty String', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: '' },
      );

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
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const defaultUserContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Título velho',
        body: 'Body velho',
        source_url: 'https://www.tabnews.com.br',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${defaultUserContent.slug}`,
        { source_url: null },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: defaultUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > defaultUserContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content with "parent_id" declared solely', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

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

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${childContent.slug}`,
        { parent_id: rootContent.id },
      );

      expect(response.status).toEqual(400);

      expect(response.status).toEqual(400);
      expect(responseBody.status_code).toEqual(400);
      expect(responseBody.name).toEqual('ValidationError');
      expect(responseBody.message).toEqual('Objeto enviado deve ter no mínimo uma chave.');
      expect(responseBody.action).toEqual('Ajuste os dados enviados e tente novamente.');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual('MODEL:VALIDATOR:FINAL_SCHEMA');
    });

    test('Content with "title" and "parent_id" set to another "parent_id"', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      const defaultUser = await contentsRequestBuilder.buildUser();

      const rootContent1 = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content title #1',
        body: 'Root content body #1',
      });

      const rootContent2 = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Root content title #2',
        body: 'Root content body #2',
      });

      const childContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Child content title',
        body: 'Child content body',
        parent_id: rootContent1.id,
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${defaultUser.username}/${childContent.slug}`,
        {
          title: 'Updated title, but not "parent_id"',
          parent_id: rootContent2.id,
        },
      );

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual({
        id: responseBody.id,
        owner_id: defaultUser.id,
        parent_id: rootContent1.id,
        slug: 'child-content-title',
        title: 'Updated title, but not "parent_id"',
        body: 'Child content body',
        status: 'draft',
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

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(responseBody.updated_at > childContent.updated_at.toISOString()).toEqual(true);
    });

    test('Content from another user', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser();
      const secondUser = await orchestrator.createUser();

      const secondUserContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo do Segundo Usuário antes do patch!',
        body: 'Body antes do patch!',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${secondUser.username}/${secondUserContent.slug}`,
        { title: 'Tentando atualizar o conteúdo.' },
      );

      expect(response.status).toEqual(403);
      expect(responseBody.status_code).toEqual(403);
      expect(responseBody.name).toEqual('ForbiddenError');
      expect(responseBody.message).toEqual('Você não possui permissão para atualizar o conteúdo de outro usuário.');
      expect(responseBody.action).toEqual('Verifique se você possui a feature "update:content:others".');
      expect(uuidVersion(responseBody.error_id)).toEqual(4);
      expect(uuidVersion(responseBody.request_id)).toEqual(4);
      expect(responseBody.error_location_code).toEqual(
        'CONTROLLER:CONTENTS:PATCH:USER_CANT_UPDATE_CONTENT_FROM_OTHER_USER',
      );
    });

    describe('TabCoins', () => {
      test('"root" content updated from "draft" to "draft" status', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'draft',
        });

        const { responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'draft' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "draft" to "published" status', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'draft',
        });

        const { responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'published' },
        );

        expect(responseBody.tabcoins).toEqual(1);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(2);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "draft" to "deleted" status', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body',
          status: 'draft',
        });

        const { responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "published" to "deleted" status (with prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        const prestigeContents = await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 8 });

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const { responseBody: userResponseBodyBefore } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBodyBefore.tabcoins).toEqual(8);
        expect(userResponseBodyBefore.tabcash).toEqual(0);

        await orchestrator.createBalance({
          balanceType: 'content:tabcoin:initial',
          recipientId: prestigeContents[0].id,
          amount: 1,
          originatorType: 'orchestrator',
          originatorId: prestigeContents[0].id,
        });

        const { responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(1);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content updated from "published" to "deleted" status (without prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const { responseBody: userResponseBodyBefore } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBodyBefore.tabcoins).toEqual(0);
        expect(userResponseBodyBefore.tabcash).toEqual(0);

        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 1 });

        const { responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(1);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('Deletion of "root" content that was first published without the minimum amount of relevant words', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 4 });

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with no minimum amount of relevant words',
          status: 'published',
        });

        const { responseBody: userResponseBodyBefore } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBodyBefore.tabcoins).toEqual(0);
        expect(userResponseBodyBefore.tabcash).toEqual(0);

        const { responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content with positive tabcoins updated from "published" to "deleted" status (with prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        const prestigeContents = await orchestrator.createPrestige(defaultUser.id);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        await orchestrator.createBalance({
          balanceType: 'content:tabcoin:credit',
          recipientId: prestigeContents[0].id,
          amount: 8,
          originatorType: 'orchestrator',
          originatorId: prestigeContents[0].id,
        });

        await orchestrator.createRate(defaultUserContent, 10);

        const { responseBody: contentFirstGetResponseBody } = await contentsRequestBuilder.get(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
        );
        expect(contentFirstGetResponseBody.tabcoins).toEqual(11);

        const { responseBody: userFirstGetResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);
        expect(userFirstGetResponseBody.tabcoins).toEqual(12);

        const { responseBody: contentSecondResponseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(contentSecondResponseBody.tabcoins).toEqual(11);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content with positive tabcoins updated from "published" to "deleted" status (without prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 8 });

        await orchestrator.createRate(defaultUserContent, 10);

        const { responseBody: contentFirstGetResponseBody } = await contentsRequestBuilder.get(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
        );
        expect(contentFirstGetResponseBody.tabcoins).toEqual(11);

        const { responseBody: userFirstGetResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);
        expect(userFirstGetResponseBody.tabcoins).toEqual(10);

        const { responseBody: contentSecondResponseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(contentSecondResponseBody.tabcoins).toEqual(11);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(0);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content with negative tabcoins updated from "published" to "deleted" status (with prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        const prestigeContents = await orchestrator.createPrestige(defaultUser.id);

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        await orchestrator.createBalance({
          balanceType: 'content:tabcoin:credit',
          recipientId: prestigeContents[0].id,
          amount: 10,
          originatorType: 'orchestrator',
          originatorId: prestigeContents[0].id,
        });

        await orchestrator.createRate(defaultUserContent, -10);

        const { responseBody: contentFirstGetResponseBody } = await contentsRequestBuilder.get(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
        );
        expect(contentFirstGetResponseBody.tabcoins).toEqual(-9);

        const { responseBody: userFirstGetResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);
        expect(userFirstGetResponseBody.tabcoins).toEqual(-8);

        const { responseBody: contentSecondResponseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(contentSecondResponseBody.tabcoins).toEqual(-9);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(-10);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"root" content with negative tabcoins updated from "published" to "deleted" status (without prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        const defaultUserContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Title',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        await orchestrator.createPrestige(defaultUser.id, { rootPrestigeNumerator: 10 });

        await orchestrator.createRate(defaultUserContent, -10);

        const { responseBody: contentFirstGetResponseBody } = await contentsRequestBuilder.get(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
        );
        expect(contentFirstGetResponseBody.tabcoins).toEqual(-9);

        const { responseBody: userFirstGetResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);
        expect(userFirstGetResponseBody.tabcoins).toEqual(-10);

        const { responseBody: contentSecondResponseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${defaultUserContent.slug}`,
          { status: 'deleted' },
        );

        expect(contentSecondResponseBody.tabcoins).toEqual(-9);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(-10);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "draft" status', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
        });

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${childContent.slug}`,
          { status: 'draft' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(2);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "published" status (same user)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'draft',
        });

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${childContent.slug}`,
          { status: 'published' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponseBody } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponseBody.tabcoins).toEqual(2);
        expect(userResponseBody.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "published" status (different user)', async () => {
        const firstUser = await orchestrator.createUser();
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(firstUser.id);
        await orchestrator.createPrestige(secondUser.id);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'draft',
        });

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(0);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${secondUser.username}/${childContent.slug}`,
          { status: 'published' },
        );

        expect(responseBody.tabcoins).toEqual(1);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "deleted" status (same user)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'draft',
        });

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(2);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "draft" to "deleted" status (different user)', async () => {
        const firstUser = await orchestrator.createUser();
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(firstUser.id);
        await orchestrator.createPrestige(secondUser.id);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'draft',
        });

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(0);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${secondUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(0);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "deleted" status (same user - with prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(defaultUser.id);

        // User will receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(2);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(2);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "deleted" status (same user - without prestige)', async () => {
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const defaultUser = await contentsRequestBuilder.buildUser();

        // User will not receive tabcoins for publishing a root content.
        const rootContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: defaultUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(0);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${defaultUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${defaultUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(0);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "deleted" status (different user - with prestige)', async () => {
        const firstUser = await orchestrator.createUser();
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const { responseBody: secondUserResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(secondUserResponse1Body.tabcoins).toEqual(2);
        expect(secondUserResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${secondUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(1);

        const { responseBody: secondUserResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(secondUserResponse2Body.tabcoins).toEqual(0);
        expect(secondUserResponse2Body.tabcash).toEqual(0);
      });

      test('"child" content updated from "published" to "deleted" status (different user - without prestige)', async () => {
        const firstUser = await orchestrator.createUser();
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const secondUser = await contentsRequestBuilder.buildUser();

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const { responseBody: secondUserResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(secondUserResponse1Body.tabcoins).toEqual(0);
        expect(secondUserResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${secondUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(1);

        const { responseBody: secondUserResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(secondUserResponse2Body.tabcoins).toEqual(0);
        expect(secondUserResponse2Body.tabcash).toEqual(0);
      });

      test('Deletion of "child" content that was first published without the minimum amount of relevant words (without votes)', async () => {
        const firstUser = await orchestrator.createUser();
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with no minimum amount of relevant words',
          status: 'published',
        });

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(0);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${secondUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(0);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(0);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('Deletion of "child" content that was first published without the minimum amount of relevant words (with positive votes)', async () => {
        const firstUser = await orchestrator.createUser();
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with no minimum amount of relevant words',
          status: 'published',
        });

        await orchestrator.createRate(childContent, 10);

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(10);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${secondUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(10);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(0);
        expect(userResponse2Body.tabcash).toEqual(0);
      });

      test('Deletion of "child" content that was first published without the minimum amount of relevant words (with negative votes)', async () => {
        const firstUser = await orchestrator.createUser();
        const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
        const usersRequestBuilder = new RequestBuilder('/api/v1/users');
        const secondUser = await contentsRequestBuilder.buildUser();
        await orchestrator.createPrestige(secondUser.id);

        const rootContent = await orchestrator.createContent({
          owner_id: firstUser.id,
          title: 'Root',
          body: 'Body with relevant texts needs to contain a good amount of words',
          status: 'published',
        });

        const childContent = await orchestrator.createContent({
          owner_id: secondUser.id,
          parent_id: rootContent.id,
          title: 'Child',
          body: 'Body with no minimum amount of relevant words',
          status: 'published',
        });

        await orchestrator.createRate(childContent, -10);

        const { responseBody: userResponse1Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse1Body.tabcoins).toEqual(-10);
        expect(userResponse1Body.tabcash).toEqual(0);

        const { responseBody: responseBody } = await contentsRequestBuilder.patch(
          `/${secondUser.username}/${childContent.slug}`,
          { status: 'deleted' },
        );

        expect(responseBody.tabcoins).toEqual(-10);

        const { responseBody: userResponse2Body } = await usersRequestBuilder.get(`/${secondUser.username}`);

        expect(userResponse2Body.tabcoins).toEqual(-10);
        expect(userResponse2Body.tabcash).toEqual(0);
      });
    });
  });

  describe('User with "update:content:others" feature', () => {
    test('Content from another user', async () => {
      const contentsRequestBuilder = new RequestBuilder('/api/v1/contents');
      await contentsRequestBuilder.buildUser({ with: ['update:content:others'] });

      const secondUser = await orchestrator.createUser();
      const secondUserContent = await orchestrator.createContent({
        owner_id: secondUser.id,
        title: 'Conteúdo do Segundo Usuário antes do patch!',
        body: 'Body antes do patch! - Body with relevant texts needs to contain a good amount of words',
        status: 'published',
      });

      const { response, responseBody } = await contentsRequestBuilder.patch(
        `/${secondUser.username}/${secondUserContent.slug}`,
        {
          title: 'Novo title.',
          body: 'Novo body.',
        },
      );

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
        tabcoins_credit: 0,
        tabcoins_debit: 0,
        owner_username: secondUser.username,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(Date.parse(responseBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.updated_at)).not.toEqual(NaN);
      expect(Date.parse(responseBody.published_at)).not.toEqual(NaN);
      expect(responseBody.published_at).toEqual(secondUserContent.published_at.toISOString());
      expect(responseBody.updated_at > secondUserContent.updated_at.toISOString()).toEqual(true);
    });
  });
});
