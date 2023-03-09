import database from 'infra/database';
import validator from 'models/validator.js';

async function findAll(values = {}, options = {}) {
  values = validateValues(values);
  await replaceOwnerUsernameWithOwnerId(values);
  const offset = (values.page - 1) * values.per_page;

  const query = {
    values: [],
  };

  if (!values.count) {
    query.values = [values.limit || values.per_page, offset];
  }

  const selectClause = buildSelectClause(values);
  const whereClause = buildWhereClause(values?.where);
  const orderByClause = buildOrderByClause(values);

  query.text = `
    WITH content_window AS (
      SELECT
        COUNT(*) OVER()::INTEGER AS total_rows,
        id
      FROM contents
      ${whereClause}
      ${orderByClause}

      ${values.count ? '' : `LIMIT $1 OFFSET $2`}
    )
    ${selectClause}
    ${orderByClause}
    ;
  `;

  if (values.where) {
    Object.keys(values.where).forEach((key) => {
      if (key === '$or') {
        values.where[key].forEach(($orObject) => {
          query.values.push(Object.values($orObject)[0]);
        });
      } else {
        if (typeof values.where[key] !== 'object') {
          query.values.push(values.where[key]);
        }
      }
    });
  }

  const results = await database.query(query, { transaction: options.transaction });

  return results;

  function buildILikeClause(like) {
    if (!like) {
      return '';
    }

    let likeClause = '';

    const keys = Object.keys(like);

    keys.forEach((key, index) => {
      likeClause += `contents.${key} ILIKE $${query.values.length + 1}`;

      query.values.push(`%${like[key]}%`);

      if (index < keys.length - 1) {
        likeClause += ' AND ';
      }
    });

    return likeClause;
  }

  function buildSelectClause(values) {
    if (values.count) {
      return `
        SELECT
          total_rows
        FROM content_window
      `;
    }

    return `
      SELECT
        contents.id,
        contents.owner_id,
        contents.parent_id,
        contents.slug,
        contents.title,
        ${!values?.attributes?.exclude?.includes('body') ? 'contents.body,' : ''}
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
              all_contents.id = contents.id AND
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
          WHERE
            children.id NOT IN (contents.id)
        ) as children_deep_count
      FROM
        contents
      INNER JOIN
        content_window ON contents.id = content_window.id
      INNER JOIN
        users ON contents.owner_id = users.id
    `;
  }

  function buildWhereClause(columns) {
    if (!columns) {
      return '';
    }

    let globalIndex = query.values.length;
    return Object.entries(columns).reduce((accumulator, column, index) => {
      if (index === 0) {
        return `WHERE ${getColumnDeclaration(column)}`;
      } else {
        return `${accumulator} AND ${getColumnDeclaration(column)}`;
      }

      function getColumnDeclaration(column) {
        const columnName = column[0];
        const columnValue = column[1];

        if (columnValue === null) {
          globalIndex += 1;
          return `contents.${columnName} IS NOT DISTINCT FROM $${globalIndex}`;
        }

        if (columnName === '$or') {
          const $orQuery = columnValue
            .map((orColumn) => {
              globalIndex += 1;
              const orColumnName = Object.keys(orColumn)[0];
              return `contents.${orColumnName} = $${globalIndex}`;
            })
            .join(' OR ');

          return `(${$orQuery})`;
        }

        if (columnName === 'search') {
          return buildILikeClause(columnValue);
        }

        globalIndex += 1;
        return `contents.${columnName} = $${globalIndex}`;
      }
    }, '');
  }

  function buildOrderByClause({ order, count }) {
    if (!order || count) {
      return '';
    }

    return `ORDER BY contents.${order}`;
  }

  async function replaceOwnerUsernameWithOwnerId(values) {
    if (values?.where?.owner_username) {
      const userOwner = await user.findOneByUsername(values.where.owner_username);
      values.where.owner_id = userOwner.id;
      delete values.where.owner_username;
    }
  }

  function validateValues(values) {
    const cleanValues = validator(values, {});

    return cleanValues;
  }
}

function parseUserQuery(text) {
  // example: title:foo body:bar
  const parts = text.trim().split(/\s+/);
  let query = {};

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('title:')) {
      // only title
      query.title = part.slice(6);
    } else if (part.startsWith('body:')) {
      // only body
      query.body = part.slice(5);
    } else {
      // both
      query.title = part;
      query.body = part;
    }
  }

  return query;
}

export default Object.freeze({
  findAll,
  parseUserQuery,
});
