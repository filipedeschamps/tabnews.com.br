import database from 'infra/database';
import pagination from 'models/pagination.js';

function generateTsQuery(cleanedSearchTerm) {
  const escapedSearchTerm = cleanedSearchTerm.replace(/'/g, "''");
  return `websearch_to_tsquery('portuguese', '${escapedSearchTerm}')`;
}

function generateOrderByClause(sortBy, tsQuery) {
  switch (sortBy) {
    case 'new':
      return 'ORDER BY created_at DESC';
    case 'relevant':
      return `ORDER BY CASE WHEN ts_rank(search, ${tsQuery}) > 0.6 THEN ts_rank(search, ${tsQuery}) ELSE 0 END DESC`;
    case 'old':
      return 'ORDER BY created_at ASC';
    default:
      return '';
  }
}

async function findAll(values = {}) {
  const query = {
    values: [],
  };

  if (!values.count) {
    const offset = (values.page - 1) * values.per_page;
    query.values = [values.limit || values.per_page, offset];
  }

  const limitOffsetClause = values.count ? 'LIMIT 1' : 'LIMIT $1 OFFSET $2';
  const tsQuery = generateTsQuery(values.q);
  const orderByClause = generateOrderByClause(values.sort, tsQuery);
  const selectClause = buildSelectClause(values, tsQuery);

  query.text = `
    WITH content_window AS (
      SELECT
        COUNT(*) OVER()::INTEGER as total_rows,
        id
      FROM 
        contents
      WHERE
        to_tsvector('portuguese', title || ' ' || slug) @@ ${tsQuery}
      AND 
        contents.status = 'published'
      AND
        contents.parent_id IS NULL
      ${orderByClause}
      ${limitOffsetClause}
    )
    ${selectClause}
  `;

  function buildSelectClause(values, tsQuery) {
    if (values.count) {
      return `
        SELECT
          total_rows
        FROM
          content_window
        `;
    }

    let selectClause = `
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
        content_window.total_rows,
        tabcoins_count.total_balance::INTEGER as tabcoins,
        tabcoins_count.total_credit::INTEGER as tabcoins_credit,
        tabcoins_count.total_debit::INTEGER as tabcoins_debit,
        (
          SELECT COUNT(*)::INTEGER
          FROM contents as children
          WHERE children.path @> ARRAY[contents.id]
           AND children.status = 'published'
        ) as children_deep_count
    `;

    if (values.sort === 'relevant') {
      selectClause += `,
        ts_rank(search, ${tsQuery}) as rank
      `;
    }

    selectClause += `
      FROM
        contents
      INNER JOIN
        content_window ON contents.id = content_window.id
      INNER JOIN
        users ON contents.owner_id = users.id
      LEFT JOIN LATERAL 
        get_content_balance_credit_debit(contents.id) tabcoins_count ON true
      WHERE 
        contents.status = 'published'
      AND 
        to_tsvector('portuguese', title || ' ' || slug) @@ ${tsQuery}
      AND
        contents.parent_id IS NULL
      ${orderByClause}
    `;

    return selectClause;
  }

  const queryResults = await database.query(query);

  const results = {
    rows: queryResults.rows,
  };

  values.total_rows = results.rows[0]?.total_rows;

  results.pagination = pagination.get(values);

  return results;
}

export default Object.freeze({
  findAll,
});
