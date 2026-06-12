/* eslint-disable no-console */

/*
  Seed de teste para o algoritmo de recomendação v2 (estratégia
  `relevant_global_v2` = queries.recentContent + lib/ranker.js).

  Injeta um conjunto pequeno e variado de posts (com votos, comentários e
  idades controladas) projetado para exercitar cada sinal do Ranker:
  qualidade (Wilson), discussão, engajamento recente, tamanho do conteúdo,
  polêmica e decaimento temporal.

  Ao final, roda a MESMA query e o MESMO Ranker usados em produção (via import
  dinâmico) e imprime o ranking resultante, para inspeção do comportamento.

  Uso (com o Postgres de desenvolvimento no ar e migrações aplicadas):
    node -r dotenv-expand/config infra/scripts/seed-ranking-test.js

  Para apenas remover os dados de teste (sem reinserir):
    node -r dotenv-expand/config infra/scripts/seed-ranking-test.js --clean

  É idempotente: remove qualquer dado de execuções anteriores (usuários com
  prefixo `ranktestseed`) antes de inserir.
*/

const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { Client } = require('pg');

const CLEAN_ONLY = process.argv.includes('--clean');

// Precisa ser alfanumérico: o validator de saída exige usernames sem símbolos.
const USER_PREFIX = 'ranktestseed';
const PASSWORD_HASH = '$2a$04$v0hvAu/y6pJ17LzeCfcKG.rDStO9x5ficm2HTLZIfeDBG8oR/uQXi'; // "password"

// Cada post root é desenhado para destacar um sinal específico do Ranker.
const POSTS = [
  {
    key: 'hit-recente',
    title: '[ranktest] Hit recente: muito votado e discutido agora',
    ageHours: 1,
    bodyLength: 6000,
    upvotes: 35,
    downvotes: 3,
    comments: { total: 14, uniqueCommenters: 8, recent: 9 },
    expectation: 'TOPO — qualidade alta, discussão forte, engajamento recente, quase sem decaimento.',
  },
  {
    key: 'classico-antigo',
    title: '[ranktest] Clássico antigo: ótimos números, porém de 5 dias atrás',
    ageHours: 120,
    bodyLength: 9000,
    upvotes: 60,
    downvotes: 2,
    comments: { total: 25, uniqueCommenters: 12, recent: 0 },
    expectation: 'BASE altíssima, mas o decaimento (e^-10) joga o score final para perto de zero.',
  },
  {
    key: 'polemico',
    title: '[ranktest] Polêmico: upvotes e downvotes quase empatados',
    ageHours: 4,
    bodyLength: 2500,
    upvotes: 22,
    downvotes: 20,
    comments: { total: 16, uniqueCommenters: 7, recent: 6 },
    expectation: 'controversyScore alto (up ≈ down). Só funciona com downvotes corrigidos para magnitude positiva.',
  },
  {
    key: 'fraco-recente',
    title: '[ranktest] Fraco recente: novo, mas curto e sem tração',
    ageHours: 2,
    bodyLength: 180,
    upvotes: 2,
    downvotes: 0,
    comments: { total: 1, uniqueCommenters: 1, recent: 1 },
    expectation: 'Baixo: pouco conteúdo e pouca discussão, ainda que com decaimento baixo.',
  },
  {
    key: 'mediano',
    title: '[ranktest] Mediano: números medianos em todos os sinais',
    ageHours: 12,
    bodyLength: 2000,
    upvotes: 12,
    downvotes: 3,
    comments: { total: 6, uniqueCommenters: 4, recent: 2 },
    expectation: 'Meio da tabela.',
  },
  {
    key: 'sem-comentarios',
    title: '[ranktest] Sem comentários: valida COUNT(child.id) = 0',
    ageHours: 6,
    bodyLength: 1500,
    upvotes: 9,
    downvotes: 1,
    comments: { total: 0, uniqueCommenters: 0, recent: 0 },
    expectation: 'comment_count/children_deep_count = 0 (antes do fix vinha 1). discussionScore ≈ 0.',
  },
  {
    key: 'net-negativo',
    title: '[ranktest] Net negativo: mais downvotes que upvotes',
    ageHours: 20,
    bodyLength: 400,
    upvotes: 1,
    downvotes: 6,
    comments: { total: 0, uniqueCommenters: 0, recent: 0 },
    expectation: 'Qualidade baixa (Wilson penaliza), tende ao fundo.',
  },
  {
    key: 'longo-recente',
    title: '[ranktest] Longo recente: artigo extenso publicado há pouco',
    ageHours: 3,
    bodyLength: 12000,
    upvotes: 14,
    downvotes: 1,
    comments: { total: 4, uniqueCommenters: 3, recent: 3 },
    expectation: 'contentScore forte (peso 2.5) + decaimento baixo deve deixá-lo bem colocado.',
  },
  {
    key: 'sem-votos',
    title: '[ranktest] Sem votos: recém-publicado e ainda sem avaliação',
    ageHours: 5,
    bodyLength: 1200,
    upvotes: 0,
    downvotes: 0,
    comments: { total: 0, uniqueCommenters: 0, recent: 0 },
    expectation: 'qualityScore depende só dos priors de Wilson (up=3, down=1). tabcoins = 0.',
  },
  {
    key: 'discussao-popular',
    title: '[ranktest] Muita discussão, poucos votos: 22 comentaristas, +3',
    ageHours: 8,
    bodyLength: 1800,
    upvotes: 3,
    downvotes: 1,
    comments: { total: 30, uniqueCommenters: 22, recent: 12 },
    expectation: 'discussionScore alto (volume + comentaristas únicos) compensando qualidade modesta.',
  },
  {
    key: 'burst-recente',
    title: '[ranktest] Rajada recente: explosão de comentários nas últimas 24h',
    ageHours: 10,
    bodyLength: 2000,
    upvotes: 8,
    downvotes: 1,
    comments: { total: 18, uniqueCommenters: 10, recent: 16 },
    expectation: 'engagementScore impulsionado por recent_comments (velocity), apesar da idade média.',
  },
  {
    key: 'comentarios-antigos',
    title: '[ranktest] Comentários antigos: post novo, discussão toda velha',
    ageHours: 4,
    bodyLength: 2200,
    upvotes: 9,
    downvotes: 2,
    comments: { total: 12, uniqueCommenters: 6, recent: 0 },
    expectation: 'comment_count alto, mas recent_comments = 0 (valida o FILTER de 24h). Engajamento baixo.',
  },
  {
    key: 'thread-profunda',
    title: '[ranktest] Thread profunda: respostas aninhadas em cadeia',
    ageHours: 6,
    bodyLength: 2500,
    upvotes: 10,
    downvotes: 2,
    comments: { total: 10, uniqueCommenters: 5, recent: 5, layout: 'thread' },
    expectation: 'avg_comment_children cresce com a profundidade (path mais longo), ativando discussionWeightDepth.',
  },
  {
    key: 'curtissimo-muito-votado',
    title: '[ranktest] Curtíssimo porém muito votado: +45 em 60 caracteres',
    ageHours: 3,
    bodyLength: 60,
    upvotes: 45,
    downvotes: 3,
    comments: { total: 2, uniqueCommenters: 2, recent: 1 },
    expectation: 'qualityScore alto, mas contentScore quase nulo: mostra a disputa entre os dois sinais.',
  },
  {
    key: 'janela-limite',
    title: '[ranktest] No limite da janela: publicado há ~6,9 dias',
    ageHours: 165,
    bodyLength: 3000,
    upvotes: 25,
    downvotes: 2,
    comments: { total: 8, uniqueCommenters: 5, recent: 0 },
    expectation: 'Ainda dentro de 7 dias (aparece), mas o decaimento (e^-13,75) zera o score na prática.',
  },
  {
    key: 'fora-da-janela',
    title: '[ranktest] Fora da janela: publicado há 8 dias',
    ageHours: 192,
    bodyLength: 3000,
    upvotes: 30,
    downvotes: 2,
    comments: { total: 5, uniqueCommenters: 3, recent: 0 },
    expectation: 'NÃO deve ser retornado pela query (published_at < NOW() - 7 days).',
  },
  {
    key: 'gemeo-a',
    title: '[ranktest] Gêmeo A: sinais idênticos ao Gêmeo B',
    ageHours: 2,
    bodyLength: 2000,
    upvotes: 12,
    downvotes: 2,
    comments: { total: 6, uniqueCommenters: 4, recent: 3 },
    expectation: 'Empate: deve ter score praticamente igual ao Gêmeo B e ficar adjacente (ordenação estável).',
  },
  {
    key: 'gemeo-b',
    title: '[ranktest] Gêmeo B: sinais idênticos ao Gêmeo A',
    ageHours: 2,
    bodyLength: 2000,
    upvotes: 12,
    downvotes: 2,
    comments: { total: 6, uniqueCommenters: 4, recent: 3 },
    expectation:
      'Empate: mesma configuração do Gêmeo A; diferença de score só no ruído de milissegundos do created_at.',
  },
  {
    key: 'half-life-exato',
    title: '[ranktest] Meia-vida exata: idade = halfLifeHours (12h)',
    ageHours: 12,
    bodyLength: 4000,
    upvotes: 30,
    downvotes: 2,
    comments: { total: 8, uniqueCommenters: 5, recent: 0 },
    expectation: 'Decaimento e^-1 ≈ 0,368: o score final é ~37% da base (referência para entender o halfLife).',
  },
  {
    key: 'muito-downvotado',
    title: '[ranktest] Muito downvotado: +5 contra -50, recente',
    ageHours: 3,
    bodyLength: 1500,
    upvotes: 5,
    downvotes: 50,
    comments: { total: 4, uniqueCommenters: 3, recent: 1 },
    expectation: 'Recente, mas Wilson pune forte (8 créditos / 51 débitos): qualidade derruba o score.',
  },
  {
    key: 'viral-sem-discussao',
    title: '[ranktest] Viral sem discussão: +200, zero comentários',
    ageHours: 2,
    bodyLength: 1000,
    upvotes: 200,
    downvotes: 5,
    comments: { total: 0, uniqueCommenters: 0, recent: 0 },
    expectation: 'qualityScore satura perto de 1, mas discussionScore = 0: qualidade pura sem conversa.',
  },
  {
    key: 'tamanho-maximo',
    title: '[ranktest] Tamanho máximo: corpo de 20000 caracteres',
    ageHours: 4,
    bodyLength: 20000,
    upvotes: 10,
    downvotes: 1,
    comments: { total: 3, uniqueCommenters: 2, recent: 1 },
    expectation: 'contentScore satura em 1,0 (logNormalize com value = max = 20000).',
  },
  {
    key: 'comentarios-rascunho',
    title: '[ranktest] Comentários em rascunho não contam',
    ageHours: 5,
    bodyLength: 1800,
    upvotes: 8,
    downvotes: 1,
    comments: { total: 5, uniqueCommenters: 3, recent: 2, draftChildren: 4 },
    expectation: 'Tem 4 filhos em rascunho: comment_count deve contar só os 5 publicados (filtro status = published).',
  },
  {
    key: 'spam-mesmo-usuario',
    title: '[ranktest] Spam: 25 comentários de um único usuário',
    ageHours: 6,
    bodyLength: 1600,
    upvotes: 6,
    downvotes: 2,
    comments: { total: 25, uniqueCommenters: 1, recent: 5 },
    expectation: 'comment_count = 25 mas unique_commenters = 1: discussionWeightUsers segura o volume inflado.',
  },
  {
    key: 'auto-comentarios',
    title: '[ranktest] Auto-comentários: autor responde o próprio post',
    ageHours: 5,
    bodyLength: 1700,
    upvotes: 9,
    downvotes: 1,
    comments: { total: 8, uniqueCommenters: 1, recent: 4, selfComments: true },
    expectation:
      'Comentários do próprio autor: unique_commenters = 1. A query conta filhos publicados de qualquer dono.',
  },
  {
    key: 'revival-necropost',
    title: '[ranktest] Necropost: antigo (5 dias) com rajada recente',
    ageHours: 120,
    bodyLength: 2500,
    upvotes: 18,
    downvotes: 3,
    comments: { total: 20, uniqueCommenters: 8, recent: 18 },
    expectation: 'Mesmo com 18 comentários recentes, o decaimento de 5 dias domina e mantém o score lá embaixo.',
  },
];

const TIME_WINDOW = '7 days'; // mesmo default de options.timeWindow em relevant_global_v2
const CANDIDATE_LIMIT = 300; // mesmo default de options.candidateLimit

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false,
});

run();

async function run() {
  await client.connect();

  try {
    await client.query('BEGIN');
    const removed = await cleanPreviousSeed();

    if (CLEAN_ONLY) {
      await client.query('COMMIT');
      await client.end();
      console.log(`\n> Limpeza concluída: ${removed} usuários ranktest removidos. Nada foi inserido.`);
      return;
    }

    const posterIds = await createUsers('u', POSTS.length);
    const commenterIds = await createUsers('c', 25);
    await seedPosts(posterIds, commenterIds);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('> Operação falhou, rollback aplicado.');
    throw error;
  }

  console.log(`\n> ${POSTS.length} posts de teste injetados.\n`);

  await previewRanking();

  await client.end();
}

async function cleanPreviousSeed() {
  const userIdsResult = await client.query(`SELECT id FROM users WHERE username LIKE $1`, [`${USER_PREFIX}%`]);
  const userIds = userIdsResult.rows.map((row) => row.id);

  if (userIds.length === 0) return 0;

  await client.query(
    `DELETE FROM content_tabcoin_operations
     WHERE recipient_id IN (SELECT id FROM contents WHERE owner_id = ANY($1))`,
    [userIds],
  );
  await client.query(`DELETE FROM contents WHERE owner_id = ANY($1)`, [userIds]);
  await client.query(`DELETE FROM users WHERE id = ANY($1)`, [userIds]);

  console.log(`> Limpeza: removidos dados de ${userIds.length} usuários ranktest anteriores.`);

  return userIds.length;
}

async function createUsers(role, count) {
  const ids = [];

  for (let i = 0; i < count; i++) {
    const username = `${USER_PREFIX}${role}${i}`;
    const email = `${username}@ranktest.local`;
    const result = await client.query(
      `INSERT INTO users (username, email, password, features) VALUES ($1, $2, $3, $4) RETURNING id`,
      [username, email, PASSWORD_HASH, []],
    );
    ids.push(result.rows[0].id);
  }

  return ids;
}

async function seedPosts(posterIds, commenterIds) {
  for (let index = 0; index < POSTS.length; index++) {
    const post = POSTS[index];
    const ownerId = posterIds[index];
    const publishedAt = hoursAgoIso(post.ageHours);

    const rootResult = await client.query(
      `INSERT INTO contents
         (owner_id, slug, title, body, status, type, path, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'published', 'content', '{}', $5, $5, $5)
       RETURNING id`,
      [ownerId, `ranktest-${post.key}`, post.title, makeBody(post.bodyLength), publishedAt],
    );
    const rootId = rootResult.rows[0].id;

    await applyVotes(rootId, ownerId, post.upvotes, post.downvotes);
    await seedComments(rootId, post, commenterIds, ownerId);
  }
}

async function applyVotes(contentId, originatorId, upvotes, downvotes) {
  // O Ranker só lê os agregados de get_content_balance_credit_debit, então uma
  // única operação de crédito/débito com o total já reproduz upvotes/downvotes.
  if (upvotes > 0) {
    await client.query(
      `INSERT INTO content_tabcoin_operations
         (balance_type, recipient_id, amount, originator_type, originator_id)
       VALUES ('credit', $1, $2, 'orchestrator', $3)`,
      [contentId, upvotes, originatorId],
    );
  }

  if (downvotes > 0) {
    // Débitos são gravados como amount negativo (convenção de balance.rateContent).
    await client.query(
      `INSERT INTO content_tabcoin_operations
         (balance_type, recipient_id, amount, originator_type, originator_id)
       VALUES ('debit', $1, $2, 'orchestrator', $3)`,
      [contentId, -downvotes, originatorId],
    );
  }
}

async function seedComments(rootId, post, commenterIds, ownerId) {
  const { total, uniqueCommenters, recent, layout = 'flat', selfComments = false, draftChildren = 0 } = post.comments;

  // O `path` de um filho é ARRAY_APPEND(path_do_pai, id_do_pai), como em content.create.
  // 'flat': todos respondem o root (path = [root], profundidade 1).
  // 'thread': cada comentário responde o anterior, gerando profundidade crescente.
  let previous = { id: rootId, path: [] };

  for (let i = 0; i < total; i++) {
    // Distribui os comentários entre `uniqueCommenters` autores distintos
    // (ou usa o próprio autor do post quando selfComments está ativo).
    const commenterId = selfComments ? ownerId : commenterIds[i % Math.max(uniqueCommenters, 1)];
    // Os `recent` primeiros ficam dentro das últimas 24h; o resto, mais antigo.
    const commentAgeHours = i < recent ? 2 : Math.max(post.ageHours, 30);
    const publishedAt = hoursAgoIso(commentAgeHours);

    const parent = layout === 'thread' ? previous : { id: rootId, path: [] };
    const path = [...parent.path, parent.id];

    const result = await client.query(
      `INSERT INTO contents
         (owner_id, parent_id, slug, body, status, type, path, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'published', 'content', $5::uuid[], $6, $6, $6)
       RETURNING id`,
      [commenterId, parent.id, `ranktest-${post.key}-c${i}`, makeBody(120 + i * 10), path, publishedAt],
    );

    previous = { id: result.rows[0].id, path };
  }

  // Filhos em rascunho: existem na tabela, mas a query só conta status = 'published'.
  for (let i = 0; i < draftChildren; i++) {
    await client.query(
      `INSERT INTO contents
         (owner_id, parent_id, slug, body, status, type, path, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'draft', 'content', ARRAY[$2]::uuid[], NOW(), NOW())`,
      [commenterIds[0], rootId, `ranktest-${post.key}-draft${i}`, makeBody(150)],
    );
  }
}

async function previewRanking() {
  const queriesUrl = pathToFileURL(join(__dirname, '..', '..', 'queries', 'rankingQueries.js')).href;
  const rankerUrl = pathToFileURL(join(__dirname, '..', '..', 'lib', 'ranker.js')).href;

  const { default: queries } = await import(queriesUrl);
  const { Ranker } = await import(rankerUrl);

  const { rows } = await client.query({
    text: queries.recentContent,
    values: [CANDIDATE_LIMIT, 0, TIME_WINDOW],
  });

  const ranked = new Ranker().execute(rows).filter((row) => String(row.title).startsWith('[ranktest]'));

  console.log('> Ranking produzido pela query + Ranker de produção (apenas posts ranktest):\n');
  console.table(
    ranked.map((row, position) => ({
      '#': position + 1,
      score: Number(row.score).toFixed(4),
      title: String(row.title).replace('[ranktest] ', '').slice(0, 38),
      tabcoins: row.tabcoins,
      up: row.upvotes,
      down: row.downvotes,
      comments: row.comment_count,
      uniq: row.unique_commenters,
      recent: row.recent_comments,
      depth: Number(row.avg_comment_children).toFixed(1),
      len: row.post_length,
      ageH: hoursSince(row.published_at),
    })),
  );

  // Posts ranktest que NÃO voltaram da query (ex.: fora da janela de 7 dias).
  const returnedTitles = new Set(ranked.map((row) => row.title));
  const absent = POSTS.filter((post) => !returnedTitles.has(post.title));
  if (absent.length) {
    console.log('\n> Posts ranktest filtrados pela query (não retornados — esperado):');
    for (const post of absent) {
      console.log(`  - ${post.title.replace('[ranktest] ', '')}\n      ${post.expectation}`);
    }
  }

  console.log('\n> Expectativa de cada post:');
  for (const post of POSTS) {
    console.log(`  - ${post.title.replace('[ranktest] ', '')}\n      ${post.expectation}`);
  }
}

function makeBody(length) {
  const sentence = 'Conteudo de teste para o algoritmo de recomendacao do TabNews. ';
  return sentence.repeat(Math.ceil(length / sentence.length)).slice(0, length);
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function hoursSince(timestamp) {
  return Math.round((Date.now() - new Date(timestamp).getTime()) / 3600000);
}
