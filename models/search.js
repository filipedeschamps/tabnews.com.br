import database from 'infra/database';
import pagination from 'models/pagination.js';

function generateTsQuery(query) {
  const cleanedSearchTerm = decodeURIComponent(query.toLowerCase().trim());
  const escapedSearchTerm = cleanedSearchTerm.replace(/'/g, "''");
  return `websearch_to_tsquery('portuguese', '${escapedSearchTerm}')`;
}

function generateOrderByClause(strategy, tsQuery) {
  switch (strategy) {
    case 'new':
      return 'ORDER BY published_at DESC';
    case 'relevant':
      return `ORDER BY CASE WHEN ts_rank(search, ${tsQuery}) > 0.6 THEN ts_rank(search, ${tsQuery}) ELSE 0 END DESC`;
    case 'old':
      return 'ORDER BY published_at ASC';
    default:
      return '';
  }
}

async function findAll(values = {}) {
  const offset = (values.page - 1) * (values.per_page || 10);
  const limit = values.limit || values.per_page || 10;
  const tsQuery = generateTsQuery(values.q);
  const orderByClause = generateOrderByClause(values.strategy, tsQuery);
  const withChildrenClause = values.only_children
    ? 'AND contents.parent_id IS NOT NULL'
    : values.with_children
      ? ''
      : 'AND contents.parent_id IS NULL';
  const bodyClause = values.only_children || values.with_children ? " || ' ' || contents.body" : '';

  const query = {
    text: `
      WITH content_window AS (
        SELECT
          COUNT(*) OVER()::INTEGER AS total_rows,
          contents.id
        FROM 
          contents
        INNER JOIN
          users ON contents.owner_id = users.id
        WHERE
          to_tsvector('portuguese', COALESCE(contents.title, '') || ' ' || contents.slug || ' ' || users.username ${bodyClause}) @@ ${tsQuery}
          AND contents.status = 'published'
          ${withChildrenClause}
          ${orderByClause}
        LIMIT $1 OFFSET $2
      )
      SELECT
        contents.id,
        contents.owner_id,
        contents.parent_id,
        contents.slug,
        contents.title,
        ${values.only_children || values.with_children ? 'contents.body,' : ''}
        contents.status,
        contents.source_url,
        contents.created_at,
        contents.updated_at,
        contents.published_at,
        contents.deleted_at,
        contents.path,
        users.username AS owner_username,
        content_window.total_rows,
        tabcoins_count.total_balance::INTEGER AS tabcoins,
        tabcoins_count.total_credit::INTEGER AS tabcoins_credit,
        tabcoins_count.total_debit::INTEGER AS tabcoins_debit,
        (
          SELECT COUNT(*)::INTEGER
          FROM contents AS children
          WHERE children.path @> ARRAY[contents.id]
          AND children.status = 'published'
        ) AS children_deep_count
        ${values.strategy === 'relevant' ? `,ts_rank(search, ${tsQuery}) AS rank` : ''}
      FROM
        content_window
      INNER JOIN
        contents ON content_window.id = contents.id
      INNER JOIN
        users ON contents.owner_id = users.id
      LEFT JOIN LATERAL 
        get_content_balance_credit_debit(contents.id) tabcoins_count ON true
    `,
    values: [limit, offset],
  };

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
