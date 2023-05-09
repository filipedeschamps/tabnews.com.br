import database from 'infra/database';
import validator from 'models/validator.js';

async function doSearch(values) {
  values = validateValues(values);

  const scopes = {
    contents: searchContent,
  };

  const scopeSearch = scopes[values.search_scope];
  return await scopeSearch(values);

  function validateValues(values) {
    const cleanValues = validator(values, {
      page: 'optional',
      per_page: 'optional',
      search_scope: 'required',
      search_term: 'required',
    });

    return cleanValues;
  }
}

async function searchContent(inputValues) {
  const results = {};
  let query = {};

  inputValues.page = inputValues.page || 1;
  const offset = (inputValues.page - 1) * inputValues.per_page;

  query.values = [
    inputValues.per_page || 30,
    offset,
    null,
    'published',
    getSearchWordsFromSearchTerm(inputValues.search_term),
  ];

  query.text = `WITH content_window AS (
      SELECT
        COUNT(*) OVER()::INTEGER as total_rows,
        id
      FROM contents
      WHERE contents.parent_id IS NOT DISTINCT FROM $3 AND contents.status = $4 AND (to_tsvector('portuguese', unaccent(title)) @@ to_tsquery('portuguese', unaccent($5)) OR to_tsvector('portuguese', unaccent(body)) @@ to_tsquery('portuguese', unaccent($5)))
      ORDER BY ts_rank(to_tsvector(contents.body),to_tsquery($5)) DESC NULLS LAST, published_at DESC
      LIMIT $1 OFFSET $2
    )
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
        users.username as owner_username,
        content_window.total_rows,
        get_current_balance('content:tabcoin', contents.id) as tabcoins,
        (
          WITH RECURSIVE children AS (
            SELECT
                id,
                parent_id
            FROM
              contents as all_contents
            WHERE
              all_contents.parent_id = contents.id AND
              all_contents.status = 'published'
            UNION ALL
              SELECT
                all_contents.id,
                all_contents.parent_id
              FROM
                contents as all_contents
              INNER JOIN
                children ON all_contents.parent_id = children.id
              WHERE
                all_contents.status = 'published'
          )
          SELECT
            count(children.id)::integer
          FROM
            children
        ) as children_deep_count
      FROM
        contents
      INNER JOIN
        content_window ON contents.id = content_window.id
      INNER JOIN
        users ON contents.owner_id = users.id
      ORDER BY ts_rank(to_tsvector(contents.body), to_tsquery($5)) DESC NULLS LAST, published_at DESC;
  `;

  const queryResult = await database.query(query);

  results.rows = queryResult.rows;
  results.pagination = getPagination(queryResult.rows);

  return results;

  function getSearchWordsFromSearchTerm(searchTerm) {
    return searchTerm
      .split(' ')
      .reduce((accumulator, word) => {
        const ignoredWords = ['que', 'com'];

        if (word.length > 2 && !ignoredWords.includes(word)) {
          accumulator.push(word);
        }

        return accumulator;
      }, [])
      .join(' | ');
  }

  function getPagination(rows) {
    const totalRows = rows[0]?.total_rows || 0;
    const perPage = inputValues.per_page;
    const firstPage = 1;
    const lastPage = Math.ceil(totalRows / inputValues.per_page);
    const nextPage = inputValues.page >= lastPage ? null : inputValues.page + 1;
    const previousPage = inputValues.page <= 1 ? null : inputValues.page > lastPage ? lastPage : inputValues.page - 1;

    return {
      currentPage: inputValues.page,
      totalRows: totalRows,
      perPage: perPage,
      firstPage: firstPage,
      nextPage: nextPage,
      previousPage: previousPage,
      lastPage: lastPage,
      search_term: inputValues.search_term,
      search_scope: 'contents',
    };
  }
}

export default Object.freeze({
  doSearch,
});
