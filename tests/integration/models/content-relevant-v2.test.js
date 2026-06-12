import content from 'models/content.js';
import orchestrator from 'tests/orchestrator.js';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

beforeEach(async () => {
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

function findWithRelevantV2() {
  // Mesma chamada feita por pages/index.public.js (estratégia da home).
  return content.findWithStrategy({
    strategy: 'relevant_v2',
    where: {
      parent_id: null,
      status: 'published',
    },
    page: 1,
    per_page: 30,
  });
}

describe('models/content findWithStrategy("relevant_v2")', () => {
  test('posts sem comentários reportam comment_count = 0', async () => {
    const author = await orchestrator.createUser();
    const post = await orchestrator.createContent({
      owner_id: author.id,
      title: 'Post sem comentários',
      status: 'published',
    });
    await orchestrator.createRate(post, 5);

    const { rows } = await findWithRelevantV2();
    const row = rows.find((item) => item.id === post.id);

    // Regressão: COUNT(*) sobre o LEFT JOIN inflava posts sem filhos para 1.
    // Com COUNT(child.id) o valor correto é 0.
    expect(Number(row.comment_count)).toBe(0);
    expect(Number(row.children_deep_count)).toBe(0);
  });

  test('downvotes são expostos como magnitude positiva', async () => {
    const author = await orchestrator.createUser();
    const post = await orchestrator.createContent({
      owner_id: author.id,
      title: 'Post com votos positivos e negativos',
      status: 'published',
    });
    await orchestrator.createRate(post, 4); // +4 upvotes (credit)
    await orchestrator.createRate(post, -2); // -2 downvotes (debit, gravado como amount negativo)

    const { rows } = await findWithRelevantV2();
    const row = rows.find((item) => item.id === post.id);

    expect(Number(row.upvotes)).toBe(4);
    // Regressão: GREATEST(total_debit, 0) zerava os downvotes (débitos são negativos).
    expect(Number(row.downvotes)).toBe(2);
    // total_balance = 1 (tabcoin inicial da publicação) + 4 créditos - 2 débitos.
    expect(Number(row.tabcoins)).toBe(3);
  });

  test('agrega comentários: contagem, comentaristas únicos e atividade recente', async () => {
    const author = await orchestrator.createUser();
    const firstCommenter = await orchestrator.createUser();
    const secondCommenter = await orchestrator.createUser();

    const post = await orchestrator.createContent({
      owner_id: author.id,
      title: 'Post discutido',
      status: 'published',
    });

    await orchestrator.createContent({
      owner_id: firstCommenter.id,
      parent_id: post.id,
      status: 'published',
      body: 'Primeiro comentário',
    });
    await orchestrator.createContent({
      owner_id: secondCommenter.id,
      parent_id: post.id,
      status: 'published',
      body: 'Segundo comentário',
    });
    // Mesmo comentarista responde de novo: não aumenta unique_commenters.
    await orchestrator.createContent({
      owner_id: firstCommenter.id,
      parent_id: post.id,
      status: 'published',
      body: 'Terceiro comentário',
    });

    const { rows } = await findWithRelevantV2();
    const row = rows.find((item) => item.id === post.id);

    expect(Number(row.comment_count)).toBe(3);
    expect(Number(row.children_deep_count)).toBe(3);
    expect(Number(row.unique_commenters)).toBe(2);
    // Comentários recém-criados estão dentro das últimas 24h.
    expect(Number(row.recent_comments)).toBe(3);
  });

  test('ordena post com mais sinais acima de post sem tração', async () => {
    const author = await orchestrator.createUser();
    const commenter = await orchestrator.createUser();

    // Post fraco criado primeiro (mais antigo) e sem discussão.
    const weakPost = await orchestrator.createContent({
      owner_id: author.id,
      title: 'Post fraco',
      body: 'curto',
      status: 'published',
    });
    await orchestrator.createRate(weakPost, 1);

    // Post forte criado depois (mais recente), muito votado e discutido.
    const strongPost = await orchestrator.createContent({
      owner_id: author.id,
      title: 'Post forte',
      status: 'published',
    });
    await orchestrator.createRate(strongPost, 15);
    await orchestrator.createContent({
      owner_id: commenter.id,
      parent_id: strongPost.id,
      status: 'published',
      body: 'Comentário relevante',
    });

    const { rows } = await findWithRelevantV2();
    const ids = rows.map((item) => item.id);

    expect(ids.indexOf(strongPost.id)).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(strongPost.id)).toBeLessThan(ids.indexOf(weakPost.id));
    expect(rows.find((item) => item.id === strongPost.id).score).toBeGreaterThan(
      rows.find((item) => item.id === weakPost.id).score,
    );
  });

  test('não inclui rascunhos nem comentários na lista raiz', async () => {
    const author = await orchestrator.createUser();

    const published = await orchestrator.createContent({
      owner_id: author.id,
      title: 'Publicado',
      status: 'published',
    });
    await orchestrator.createRate(published, 3);

    const draft = await orchestrator.createContent({
      owner_id: author.id,
      title: 'Rascunho',
      status: 'draft',
    });

    const comment = await orchestrator.createContent({
      owner_id: author.id,
      parent_id: published.id,
      status: 'published',
      body: 'Comentário',
    });

    const { rows } = await findWithRelevantV2();
    const ids = rows.map((item) => item.id);

    expect(ids).toContain(published.id);
    expect(ids).not.toContain(draft.id);
    expect(ids).not.toContain(comment.id);
  });
});
