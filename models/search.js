import database from 'infra/database';

function formatMilliseconds(milliseconds) {
  const seconds = milliseconds / 1000;
  const formattedSeconds = seconds.toFixed(3);
  const plural = seconds !== 1 ? 's' : '';

  return `${formattedSeconds} segundo${plural}`;
}

function cleanSearchTerm(searchTerm) {
  const wordsAndNumbers = searchTerm.match(/[a-zA-Z]+|\d+/g);
  const filteredWordsAndNumbers = wordsAndNumbers.map((item) => {
    return item.replace(/[^a-zA-Z0-9]/g, '');
  });
  const separatedWords = filteredWordsAndNumbers
    .join(' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean);
  return separatedWords.join(':* | ');
}

function generateTsQuery(cleanedSearchTerm) {
  return `to_tsquery('portuguese', websearch_to_tsquery('portuguese','${cleanedSearchTerm}')::text || ':*')`;
}

function generateOrderByClause(sortBy, tsQuery) {
  let orderByClause = '';
  if (sortBy === 'date') {
    orderByClause = 'ORDER BY created_at DESC';
  } else if (sortBy === 'relevance') {
    orderByClause = `ORDER BY ts_rank(ts, ${tsQuery}) DESC`;
  } else if (sortBy === 'old') {
    orderByClause = 'ORDER BY created_at ASC';
  }
  return orderByClause;
}

async function findAll({ searchTerm, sortBy = 'date', page = 1, perPage = 30 }) {
  const separatedWords = cleanSearchTerm(searchTerm);

  const tsQuery = generateTsQuery(separatedWords);

  const offset = (page - 1) * perPage;

  const totalCountQuery = {
    text: `
      SELECT COUNT(*) 
      FROM contents 
      WHERE to_tsvector('portuguese', title) @@ ${tsQuery}
        AND status = 'published';
    `,
  };

  const searchQuery = {
    text: `
      SELECT
        contents.id,
        contents.owner_id,
        contents.parent_id,
        contents.slug,
        contents.title,
        contents.status,
        contents.source_url,
        contents.created_at,
        contents.updated_at,
        contents.published_at,
        contents.deleted_at,
        contents.path,
        users.username as owner_username,
        tabcoins_count.total_balance as tabcoins,
        tabcoins_count.total_credit as tabcoins_credit,
        tabcoins_count.total_debit as tabcoins_debit,
        (
          SELECT COUNT(*)
          FROM contents as children
          WHERE children.path @> ARRAY[contents.id]
            AND children.status = 'published'
        ) as children_deep_count
      FROM
        contents
      INNER JOIN (
        SELECT
          id
        FROM 
          contents
        WHERE 
          to_tsvector('portuguese', contents.title) @@ ${tsQuery}
          AND contents.status = 'published'
        ${generateOrderByClause(sortBy, tsQuery)}
        LIMIT $1 OFFSET $2
      ) AS content_window ON contents.id = content_window.id
      INNER JOIN
        users ON contents.owner_id = users.id
      LEFT JOIN LATERAL get_content_balance_credit_debit(contents.id) tabcoins_count ON true
      WHERE 
        contents.status = 'published'
      AND 
        to_tsvector('portuguese', contents.title) @@ ${tsQuery}
      ${generateOrderByClause(sortBy, tsQuery)}
    `,
    values: [perPage, offset],
  };

  const startTime = performance.now();

  const searchResults = await database.query(searchQuery);

  if (searchResults.rows.length > 0) {
    const updateTrendsQuery = {
      text: `
        INSERT INTO searches (search_term, search_count, updated_at)
        VALUES ($1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (search_term)
        DO UPDATE SET search_count = 
          CASE
            WHEN (CURRENT_TIMESTAMP - searches.updated_at) > INTERVAL '3 minutes' THEN searches.search_count + 1
            ELSE searches.search_count
          END,
          updated_at = 
          CASE
            WHEN (CURRENT_TIMESTAMP - searches.updated_at) > INTERVAL '3 minutes' THEN CURRENT_TIMESTAMP
            ELSE searches.updated_at
          END
        WHERE searches.search_term = $1;
      `,
      values: [searchTerm],
    };

    await database.query(updateTrendsQuery);

    const totalCountResult = await database.query(totalCountQuery);
    const totalResults = parseInt(totalCountResult.rows[0].count);

    const firstPage = 1;
    const lastPage = Math.ceil(totalResults / perPage);
    const nextPage = page >= lastPage ? null : parseInt(page) + 1;
    const previousPage = page <= 1 ? null : page - 1;

    const pagination = {
      currentPage: parseInt(page),
      totalRows: totalResults,
      perPage: parseInt(perPage),
      firstPage: firstPage,
      nextPage: nextPage,
      previousPage: previousPage,
      lastPage: lastPage,
    };

    const endTime = performance.now();
    const searchRuntime = endTime - startTime;

    return {
      searchRuntime: formatMilliseconds(searchRuntime),
      pagination,
      results: searchResults.rows,
    };
  }
}

async function findAllTrends() {
  const startTime = performance.now();

  const query = {
    text: `
      WITH recent_searches AS (
        SELECT search_term, search_count, updated_at
        FROM searches
        WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days'
      )
      SELECT search_term, search_count, updated_at
      FROM recent_searches
      WHERE search_count >= 20
      ORDER BY search_count DESC
      LIMIT 10;
    `,
  };

  const res = await database.query(query);
  const endTime = performance.now();
  const searchRuntime = endTime - startTime;

  const results = res.rows;

  return {
    searchRuntime: formatMilliseconds(searchRuntime),
    results,
  };
}

async function findAllSuggestions(partialTerm) {
  const startTime = performance.now();

  const separatedWords = cleanSearchTerm(partialTerm);

  const tsQuery = generateTsQuery(separatedWords);

  const query = {
    text: `
          SELECT 
            *
          FROM searches s
          WHERE to_tsvector('portuguese', s.search_term) @@ ${tsQuery}
          ORDER BY s.search_count DESC NULLS LAST
          LIMIT 10
        `,
  };

  const res = await database.query(query);
  const endTime = performance.now();
  const searchRuntime = endTime - startTime;

  const results = res.rows;

  return {
    searchRuntime: formatMilliseconds(searchRuntime),
    results,
  };
}

export default Object.freeze({
  findAll,
  findAllTrends,
  findAllSuggestions,
});
