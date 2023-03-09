import orchestrator from 'tests/orchestrator.js';
import fetch from 'cross-fetch';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/search', () => {
  beforeEach(async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  test('With no specific query', async () => {
    const user = await orchestrator.createUser();

    const firstContent = await orchestrator.createContent({
      owner_id: user.id,
      title: 'Primeiro conteúdo para teste',
      status: 'published',
    });

    const secondContent = await orchestrator.createContent({
      owner_id: user.id,
      title: 'Segundo conteúdo para teste',
      status: 'published',
    });

    const thirdContent = await orchestrator.createContent({
      owner_id: user.id,
      title: 'Terceiro conteúdo para teste',
      status: 'published',
    });

    const fourthContent = await orchestrator.createContent({
      owner_id: user.id,
      title: 'Quarto conteúdo para teste',
      status: 'published',
    });

    const query = 'conteúdo';
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?query=${query}`);
    const responseBody = await response.json();

    expect(response.status).toBe(200);

    expect(responseBody).toEqual([
      {
        id: firstContent.id,
        owner_id: user.id,
        parent_id: null,
        slug: 'primeiro-conteudo-para-teste',
        title: 'Primeiro conteúdo para teste',
        body: firstContent.body,
        status: 'published',
        source_url: null,
        created_at: firstContent.created_at.toISOString(),
        updated_at: firstContent.updated_at.toISOString(),
        published_at: firstContent.published_at.toISOString(),
        deleted_at: null,
        tabcoins: 1,
        owner_username: user.username,
        children_deep_count: 0,
      },
      {
        id: secondContent.id,
        owner_id: user.id,
        parent_id: null,
        slug: 'segundo-conteudo-para-teste',
        title: 'Segundo conteúdo para teste',
        body: secondContent.body,
        status: 'published',
        source_url: null,
        created_at: secondContent.created_at.toISOString(),
        updated_at: secondContent.updated_at.toISOString(),
        published_at: secondContent.published_at.toISOString(),
        deleted_at: null,
        tabcoins: 1,
        owner_username: user.username,
        children_deep_count: 0,
      },
      {
        id: thirdContent.id,
        owner_id: user.id,
        parent_id: null,
        slug: 'terceiro-conteudo-para-teste',
        title: 'Terceiro conteúdo para teste',
        body: thirdContent.body,
        status: 'published',
        source_url: null,
        created_at: thirdContent.created_at.toISOString(),
        updated_at: thirdContent.updated_at.toISOString(),
        published_at: thirdContent.published_at.toISOString(),
        deleted_at: null,
        tabcoins: 1,
        owner_username: user.username,
        children_deep_count: 0,
      },
      {
        id: fourthContent.id,
        owner_id: user.id,
        parent_id: null,
        slug: 'quarto-conteudo-para-teste',
        title: 'Quarto conteúdo para teste',
        body: fourthContent.body,
        status: 'published',
        source_url: null,
        created_at: fourthContent.created_at.toISOString(),
        updated_at: fourthContent.updated_at.toISOString(),
        published_at: fourthContent.published_at.toISOString(),
        deleted_at: null,
        tabcoins: 1,
        owner_username: user.username,
        children_deep_count: 0,
      },
    ]);
  });

  test('With specify title query', async () => {
    const user = await orchestrator.createUser();

    await orchestrator.createContent({
      owner_id: user.id,
      title: 'Primeiro conteúdo para teste',
      status: 'published',
    });

    await orchestrator.createContent({
      owner_id: user.id,
      title: 'Segundo conteúdo para teste',
      status: 'published',
    });

    await orchestrator.createContent({
      owner_id: user.id,
      title: 'Terceiro conteúdo para teste',
      status: 'published',
    });

    const fourthContent = await orchestrator.createContent({
      owner_id: user.id,
      title: 'Quarto conteúdo para teste',
      status: 'published',
    });

    const query = 'quarto';
    const response = await fetch(`${orchestrator.webserverUrl}/api/v1/search?query=${query}`);
    const responseBody = await response.json();

    expect(response.status).toBe(200);

    expect(responseBody).toEqual([
      {
        id: fourthContent.id,
        owner_id: user.id,
        parent_id: null,
        slug: 'quarto-conteudo-para-teste',
        title: 'Quarto conteúdo para teste',
        body: fourthContent.body,
        status: 'published',
        source_url: null,
        created_at: fourthContent.created_at.toISOString(),
        updated_at: fourthContent.updated_at.toISOString(),
        published_at: fourthContent.published_at.toISOString(),
        deleted_at: null,
        tabcoins: 1,
        owner_username: user.username,
        children_deep_count: 0,
      },
    ]);
  });

  test('With specify body query', async () => {
    const user = await orchestrator.createUser();

    const firstContent = await orchestrator.createContent({
      owner_id: user.id,
      title: 'Primeiro conteúdo para teste',
      body: 'Palavra chave para teste: banana',
      status: 'published',
    });

    const secondContent = await orchestrator.createContent({
      owner_id: user.id,
      title: 'Segundo conteúdo para teste',
      body: 'Palavra chave para teste: maçã',
      status: 'published',
    });

    const firstQuery = 'body:banana';
    const firstResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/search?query=${firstQuery}`);
    const firstResponseBody = await firstResponse.json();

    expect(firstResponse.status).toBe(200);

    expect(firstResponseBody).toEqual([
      {
        id: firstContent.id,
        owner_id: user.id,
        parent_id: null,
        slug: 'primeiro-conteudo-para-teste',
        title: 'Primeiro conteúdo para teste',
        body: firstContent.body,
        status: 'published',
        source_url: null,
        created_at: firstContent.created_at.toISOString(),
        updated_at: firstContent.updated_at.toISOString(),
        published_at: firstContent.published_at.toISOString(),
        deleted_at: null,
        tabcoins: 1,
        owner_username: user.username,
        children_deep_count: 0,
      },
    ]);

    const secondQuery = 'body:maçã';
    const secondResponse = await fetch(`${orchestrator.webserverUrl}/api/v1/search?query=${secondQuery}`);
    const secondeResponseBody = await secondResponse.json();

    expect(secondResponse.status).toBe(200);

    expect(secondeResponseBody).toEqual([
      {
        id: secondContent.id,
        owner_id: user.id,
        parent_id: null,
        slug: 'segundo-conteudo-para-teste',
        title: 'Segundo conteúdo para teste',
        body: secondContent.body,
        status: 'published',
        source_url: null,
        created_at: secondContent.created_at.toISOString(),
        updated_at: secondContent.updated_at.toISOString(),
        published_at: secondContent.published_at.toISOString(),
        deleted_at: null,
        tabcoins: 1,
        owner_username: user.username,
        children_deep_count: 0,
      },
    ]);
  });
});
