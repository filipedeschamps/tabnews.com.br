import { v4 as uuidV4 } from 'uuid';
import slug from 'slug';
import database from 'infra/database.js';
import validator from 'models/validator.js';
import user from 'models/user.js';
import balance from 'models/balance.js';
import { ValidationError } from 'errors/index.js';

async function findAll(values = {}, options = {}) {
  values = validateValues(values);
  await replaceUsernameWithOwnerId(values);
  const offset = (values.page - 1) * values.per_page;

  const query = {
    values: [],
  };

  if (!values.count) {
    query.values = [values.limit || values.per_page, offset];
  }
  const selectClause = buildSelectClause(values);
  const whereClause = buildWhereClause(values?.where);
  const orderByClause = buildOrderByClause(values?.order);

  query.text = `
      ${selectClause}
      ${whereClause}
      ${orderByClause}

      ${values.count ? 'LIMIT 1' : 'LIMIT $1 OFFSET $2'}
      ;`;

  if (values.where) {
    Object.keys(values.where).forEach((key) => {
      if (key === '$or') {
        values.where[key].forEach(($orObject) => {
          query.values.push(Object.values($orObject)[0]);
        });
      } else {
        query.values.push(values.where[key]);
      }
    });
  }

  const results = await database.query(query, { transaction: options.transaction });

  if (values.count) {
    return results.rows.length > 0 ? results.rows[0].total_rows : 0;
  }

  // TODO: this need to be optimized in the future.
  // Too many travels to the database just to get one value.
  for await (const contentObject of results.rows) {
    contentObject.children_deep_count = await findChildrenCount(
      {
        where: {
          id: contentObject.id,
        },
      },
      {
        transaction: options.transaction,
      }
    );
  }

  return results.rows;

  async function replaceUsernameWithOwnerId(values) {
    if (values?.where?.username) {
      const userOwner = await user.findOneByUsername(values.where.username);
      values.where.owner_id = userOwner.id;
      delete values.where.username;
    }
  }

  function validateValues(values) {
    const cleanValues = validator(values, {
      page: 'optional',
      per_page: 'optional',
      order: 'optional',
      where: 'optional',
      count: 'optional',
      $or: 'optional',
      limit: 'optional',
      attributes: 'optional',
    });

    return cleanValues;
  }

  function buildSelectClause(values) {
    if (values.count) {
      return `
        SELECT
          COUNT(*) OVER()::INTEGER as total_rows
        FROM
          contents
        `;
    }

    return `
      SELECT
        contents.id as id,
        contents.owner_id as owner_id,
        contents.parent_id as parent_id,
        contents.slug as slug,
        contents.title as title,
        ${!values?.attributes?.exclude?.includes('body') ? 'contents.body as body,' : ''}
        contents.status as status,
        contents.source_url as source_url,
        contents.created_at as created_at,
        contents.updated_at as updated_at,
        contents.published_at as published_at,
        contents.deleted_at as deleted_at,
        users.username as username,
        parent_content.title as parent_title,
        parent_content.slug as parent_slug,
        parent_user.username as parent_username,
        get_current_balance('content:tabcoin', contents.id) as tabcoins
      FROM
        contents
      INNER JOIN
        users ON contents.owner_id = users.id
      LEFT JOIN
        contents as parent_content ON contents.parent_id = parent_content.id
      LEFT JOIN
        users as parent_user ON parent_content.owner_id = parent_user.id
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

        globalIndex += 1;
        return `contents.${columnName} = $${globalIndex}`;
      }
    }, '');
  }

  function buildOrderByClause(orderBy) {
    if (!orderBy) {
      return '';
    }

    return `ORDER BY contents.${orderBy}`;
  }
}

async function findOne(values, options = {}) {
  values.limit = 1;
  const rows = await findAll(values, options);
  return rows[0];
}

async function findWithStrategy(options = {}) {
  const strategies = {
    new: getNew,
    old: getOld,
    best: getBest,
  };

  return await strategies[options.strategy](options);

  async function getNew(options = {}) {
    const results = {};

    options.order = 'published_at DESC';
    results.rows = await findAll(options);
    results.pagination = await getPagination(options);

    return results;
  }

  async function getOld(options = {}) {
    const results = {};

    options.order = 'published_at ASC';
    results.rows = await findAll(options);
    results.pagination = await getPagination(options);

    return results;
  }

  async function getBest(options = {}) {
    const results = {};

    options.order = 'published_at DESC';
    const contentList = await findAll(options);
    const rankedContentList = rankContentListByBest(contentList);
    results.rows = rankedContentList;
    results.pagination = await getPagination(options);

    return results;
  }
}

async function getPagination(options) {
  options.count = true;

  const totalRows = await findAll(options);
  const perPage = options.per_page;
  const firstPage = 1;
  const lastPage = Math.ceil(totalRows / options.per_page);
  const nextPage = options.page >= lastPage ? null : options.page + 1;
  const previousPage = options.page <= 1 ? null : options.page - 1;
  const strategy = options.strategy;

  return {
    currentPage: options.page,
    totalRows: totalRows,
    perPage: perPage,
    firstPage: firstPage,
    nextPage: nextPage,
    previousPage: previousPage,
    lastPage: lastPage,
    strategy: strategy,
  };
}

async function create(postedContent, options = {}) {
  populateSlug(postedContent);
  populateStatus(postedContent);
  const validContent = validateCreateSchema(postedContent);

  checkRootContentTitle(validContent);

  if (validContent.parent_id) {
    await checkIfParentIdExists(validContent, {
      transaction: options.transaction,
    });
  }

  populatePublishedAtValue(null, validContent);

  const newContent = await runInsertQuery(validContent, {
    transaction: options.transaction,
  });

  await creditOrDebitTabCoins(null, newContent, {
    eventId: options.eventId,
    transaction: options.transaction,
  });

  newContent.tabcoins = await balance.getTotal(
    {
      balanceType: 'content:tabcoin',
      recipientId: newContent.id,
    },
    {
      transaction: options.transaction,
    }
  );

  return newContent;

  async function runInsertQuery(content, options) {
    const query = {
      text: `
      WITH
        inserted_content as (
          INSERT INTO
            contents (parent_id, owner_id, slug, title, body, status, source_url, published_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        )
      SELECT
        inserted_content.id as id,
        inserted_content.owner_id as owner_id,
        inserted_content.parent_id as parent_id,
        inserted_content.slug as slug,
        inserted_content.title as title,
        inserted_content.body as body,
        inserted_content.status as status,
        inserted_content.source_url as source_url,
        inserted_content.created_at as created_at,
        inserted_content.updated_at as updated_at,
        inserted_content.published_at as published_at,
        inserted_content.deleted_at as deleted_at,
        users.username as username,
        parent_content.title as parent_title,
        parent_content.slug as parent_slug,
        parent_user.username as parent_username
      FROM
        inserted_content
      INNER JOIN
        users ON inserted_content.owner_id = users.id
      LEFT JOIN
        contents as parent_content ON inserted_content.parent_id = parent_content.id
      LEFT JOIN
        users as parent_user ON parent_content.owner_id = parent_user.id
      ;`,
      values: [
        content.parent_id,
        content.owner_id,
        content.slug,
        content.title,
        content.body,
        content.status,
        content.source_url,
        content.published_at,
      ],
    };

    try {
      const results = await database.query(query, { transaction: options.transaction });
      return results.rows[0];
    } catch (error) {
      throw parseQueryErrorToCustomError(error);
    }
  }
}

function populateSlug(postedContent) {
  if (!postedContent.slug) {
    postedContent.slug = getSlug(postedContent.title) || uuidV4();
  }
}

function getSlug(title) {
  if (!title) {
    return;
  }

  slug.extend({
    '%': ' por cento',
    '>': '-',
    '<': '-',
    '@': '-',
    '.': '-',
    ',': '-',
    '&': 'e',
  });

  const generatedSlug = slug(title, {
    trim: true,
  });

  const truncatedSlug = generatedSlug.substring(0, 256);

  return truncatedSlug;
}

function populateStatus(postedContent) {
  postedContent.status = postedContent.status || 'draft';
}

async function checkIfParentIdExists(content, options) {
  const existingContent = await findOne(
    {
      where: {
        id: content.parent_id,
      },
    },
    options
  );

  if (!existingContent) {
    throw new ValidationError({
      message: `Você está tentando criar ou atualizar um sub-conteúdo para um conteúdo que não existe.`,
      action: `Utilize um "parent_id" que aponte para um conteúdo que existe.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND',
      statusCode: 400,
      key: 'parent_id',
    });
  }
}

function parseQueryErrorToCustomError(error) {
  if (error.databaseErrorCode === '23505') {
    return new ValidationError({
      message: `O conteúdo enviado parece ser duplicado.`,
      action: `Utilize um "title" ou "slug" diferente.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
      statusCode: 400,
      key: 'slug',
    });
  }

  return error;
}

function validateCreateSchema(content) {
  const cleanValues = validator(content, {
    parent_id: 'optional',
    owner_id: 'required',
    slug: 'required',
    title: 'optional',
    body: 'required',
    status: 'required',
    source_url: 'optional',
  });

  if (cleanValues.status === 'deleted') {
    throw new ValidationError({
      message: 'Não é possível criar um novo conteúdo diretamente com status "deleted".',
      key: 'status',
      type: 'any.only',
      errorLocationCode: 'MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:STATUS_DELETED',
    });
  }

  return cleanValues;
}

function checkRootContentTitle(content) {
  if (!content.parent_id && !content.title) {
    throw new ValidationError({
      message: `"title" é um campo obrigatório.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE',
      statusCode: 400,
      key: 'title',
    });
  }
}

function populatePublishedAtValue(oldContent, newContent) {
  if (oldContent && oldContent.published_at) {
    newContent.published_at = oldContent.published_at;
    return;
  }

  if (oldContent && !oldContent.published_at && newContent.status === 'published') {
    newContent.published_at = new Date();
    return;
  }

  if (!oldContent && newContent.status === 'published') {
    newContent.published_at = new Date();
    return;
  }
}

async function creditOrDebitTabCoins(oldContent, newContent, options = {}) {
  // We should not credit or debit if the parent content is from the same user.
  // TODO: in the future, we should check using ids instead of usernames.
  if (newContent.username === newContent.parent_username) {
    return;
  }

  // We should not credit or debit if the content has never been published before.
  // and is being directly deleted, example: "draft" -> "deleted".
  if (oldContent && !oldContent.published_at && newContent.status === 'deleted') {
    return;
  }

  // We should debit if the content was once published, but now is being deleted.
  if (oldContent && oldContent.published_at && newContent.status === 'deleted') {
    await balance.create(
      {
        balanceType: 'user:tabcoin',
        recipientId: newContent.owner_id,
        amount: -5,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );
    return;
  }

  // We should credit if the content already existed and is now being published for the first time.
  if (oldContent && !oldContent.published_at && newContent.status === 'published') {
    await balance.create(
      {
        balanceType: 'user:tabcoin',
        recipientId: newContent.owner_id,
        amount: 5,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );

    await balance.create(
      {
        balanceType: 'content:tabcoin',
        recipientId: newContent.id,
        amount: 1,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );
    return;
  }

  // We should credit if the content is being created directly with "published" status.
  if (!oldContent && newContent.published_at) {
    await balance.create(
      {
        balanceType: 'user:tabcoin',
        recipientId: newContent.owner_id,
        amount: 5,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );

    await balance.create(
      {
        balanceType: 'content:tabcoin',
        recipientId: newContent.id,
        amount: 1,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );
    return;
  }
}

async function update(contentId, postedContent, options = {}) {
  const validPostedContent = validateUpdateSchema(postedContent);

  const oldContent = await findOne(
    {
      where: {
        id: contentId,
      },
    },
    options
  );

  const newContent = { ...oldContent, ...validPostedContent };

  throwIfContentIsAlreadyDeleted(oldContent);
  checkRootContentTitle(newContent);
  checkForParentIdRecursion(newContent);

  if (newContent.parent_id) {
    await checkIfParentIdExists(newContent, {
      transaction: options.transaction,
    });
  }

  populatePublishedAtValue(oldContent, newContent);
  populateDeletedAtValue(newContent);

  const updatedContent = await runUpdateQuery(newContent, options);

  await creditOrDebitTabCoins(oldContent, updatedContent, {
    eventId: options.eventId,
    transaction: options.transaction,
  });

  updatedContent.tabcoins = await balance.getTotal(
    {
      balanceType: 'content:tabcoin',
      recipientId: updatedContent.id,
    },
    {
      transaction: options.transaction,
    }
  );

  return updatedContent;

  async function runUpdateQuery(content, options = {}) {
    const query = {
      text: `
      WITH
        updated_content as (
          UPDATE contents SET
            parent_id = $2,
            slug = $3,
            title = $4,
            body = $5,
            status = $6,
            source_url = $7,
            published_at = $8,
            updated_at = (now() at time zone 'utc'),
            deleted_at = $9
          WHERE
            id = $1
          RETURNING *
        )
      SELECT
        updated_content.id as id,
        updated_content.owner_id as owner_id,
        updated_content.parent_id as parent_id,
        updated_content.slug as slug,
        updated_content.title as title,
        updated_content.body as body,
        updated_content.status as status,
        updated_content.source_url as source_url,
        updated_content.created_at as created_at,
        updated_content.updated_at as updated_at,
        updated_content.published_at as published_at,
        updated_content.deleted_at as deleted_at,
        users.username as username,
        parent_content.title as parent_title,
        parent_content.slug as parent_slug,
        parent_user.username as parent_username
      FROM
        updated_content
      INNER JOIN
        users ON updated_content.owner_id = users.id
      LEFT JOIN
        contents as parent_content ON updated_content.parent_id = parent_content.id
      LEFT JOIN
        users as parent_user ON parent_content.owner_id = parent_user.id
      ;`,
      values: [
        content.id,
        content.parent_id,
        content.slug,
        content.title,
        content.body,
        content.status,
        content.source_url,
        content.published_at,
        content.deleted_at,
      ],
    };
    try {
      const results = await database.query(query, { transaction: options.transaction });
      return results.rows[0];
    } catch (error) {
      throw parseQueryErrorToCustomError(error);
    }
  }
}

function validateUpdateSchema(content) {
  const cleanValues = validator(content, {
    parent_id: 'optional',
    slug: 'optional',
    title: 'optional',
    body: 'optional',
    status: 'optional',
    source_url: 'optional',
  });

  return cleanValues;
}

function checkForParentIdRecursion(content) {
  if (content.parent_id === content.id) {
    throw new ValidationError({
      message: `"parent_id" não deve apontar para o próprio conteúdo.`,
      action: `Utilize um "parent_id" diferente do "id" do mesmo conteúdo.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:CONTENT:CHECK_FOR_PARENT_ID_RECURSION:RECURSION_FOUND',
      statusCode: 400,
      key: 'parent_id',
    });
  }
}

function populateDeletedAtValue(contentObject) {
  if (!contentObject.deleted_at && contentObject.status === 'deleted') {
    contentObject.deleted_at = new Date();
  }
}

function throwIfContentIsAlreadyDeleted(oldContent) {
  if (oldContent.status === 'deleted') {
    throw new ValidationError({
      message: `Não é possível alterar informações de um conteúdo já deletado.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:CONTENT:CHECK_STATUS_CHANGE:STATUS_ALREADY_DELETED',
      statusCode: 400,
      key: 'status',
    });
  }
}

async function findChildrenTree(options) {
  options.where = validateWhereSchema(options?.where);
  const childrenFlatList = await recursiveDatabaseLookup(options);
  const childrenFlatListRanked = rankContentListByBest(childrenFlatList);
  const childrenTree = flatListToTree(childrenFlatListRanked);
  return childrenTree.children;

  async function recursiveDatabaseLookup(options) {
    const query = {
      text: `
      WITH RECURSIVE children AS (
        SELECT
            id,
            owner_id,
            parent_id,
            slug,
            title,
            body,
            status,
            source_url,
            created_at,
            updated_at,
            published_at,
            deleted_at
        FROM
          contents
        WHERE
          contents.id = $1 AND
          contents.status = 'published'
        UNION ALL
          SELECT
            contents.id,
            contents.owner_id,
            contents.parent_id,
            contents.slug,
            contents.title,
            contents.body,
            contents.status,
            contents.source_url,
            contents.created_at,
            contents.updated_at,
            contents.published_at,
            contents.deleted_at
          FROM
            contents
          INNER JOIN
            children ON contents.parent_id = children.id
          WHERE
            contents.status = 'published'

      )
      SELECT
        children.id as id,
        children.owner_id as owner_id,
        children.parent_id as parent_id,
        children.slug as slug,
        children.title as title,
        children.body as body,
        children.status as status,
        children.source_url as source_url,
        children.created_at as created_at,
        children.updated_at as updated_at,
        children.published_at as published_at,
        children.deleted_at as deleted_at,
        users.username as username,
        parent_content.title as parent_title,
        parent_content.slug as parent_slug,
        parent_user.username as parent_username,
        get_current_balance('content:tabcoin', children.id) as tabcoins
      FROM
        children
      INNER JOIN
        users ON children.owner_id = users.id
      LEFT JOIN
        contents as parent_content ON children.parent_id = parent_content.id
      LEFT JOIN
        users as parent_user ON parent_content.owner_id = parent_user.id
      ORDER BY
        children.published_at ASC;
      ;`,
      values: [options.where.parent_id],
    };
    const results = await database.query(query);
    return results.rows;
  }

  function validateWhereSchema(where) {
    const cleanValues = validator(where, {
      parent_id: 'required',
    });

    return cleanValues;
  }

  function flatListToTree(list) {
    let tree;
    const table = {};

    list.forEach((row) => {
      table[row.id] = row;
      table[row.id].children = [];
    });

    list.forEach((row) => {
      if (table[row.parent_id]) {
        table[row.parent_id].children.push(row);
      } else {
        tree = row;
      }
    });

    recursiveInjectChildrenDeepCount(tree);

    function recursiveInjectChildrenDeepCount(node) {
      let count = node.children.length;

      if (node.children) {
        node.children.forEach((child) => {
          count += recursiveInjectChildrenDeepCount(child);
        });
      }

      node.children_deep_count = count;
      return count;
    }

    return tree;
  }
}

function rankContentListByBest(contentList) {
  const rankedContentList = contentList.map(injectScoreProperty).sort(sortByScore);

  return rankedContentList;

  function injectScoreProperty(contentObject) {
    return {
      ...contentObject,
      score: getContentScore(contentObject),
    };
  }

  function sortByScore(first, second) {
    return second.score - first.score;
  }

  // Inspired by:
  // https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d
  // https://medium.com/hacking-and-gonzo/how-reddit-ranking-algorithms-work-ef111e33d0d9
  function getContentScore(contentObject) {
    const tabcoins = contentObject.tabcoins;
    const secondsSinceEpoch = Math.floor(new Date() / 1000);
    const publishedAtInSeconds = Math.floor(new Date(contentObject.published_at) / 1000);
    const ageInSeconds = secondsSinceEpoch - publishedAtInSeconds;
    const ageBase = 60 * 60 * 1; // 1 hour
    const boostPeriodInSeconds = 60 * 10; // 10 minutes
    const initialBoost = ageInSeconds < boostPeriodInSeconds ? 10 : 1;
    const tabcoinsAntiGravity = 1.5;
    const tabcoinsWithAntiGravity = Math.pow(Math.abs(tabcoins), tabcoinsAntiGravity);
    const tabcoinsWithCorrectSign = tabcoins > 0 ? tabcoinsWithAntiGravity : tabcoinsWithAntiGravity * -1;
    const gravity = 1.8;

    const scoreDecimals = (tabcoinsWithCorrectSign + initialBoost) / Math.pow(ageInSeconds + ageBase, gravity);
    const finalScore = scoreDecimals * 10000;
    return finalScore;
  }
}

async function findChildrenCount(values, options = {}) {
  values.where = validateWhereSchema(values?.where);
  const childrenCount = await recursiveDatabaseLookup(values, options);
  return childrenCount;

  async function recursiveDatabaseLookup(values, options = {}) {
    const query = {
      text: `
      WITH RECURSIVE children AS (
        SELECT
            id,
            parent_id
        FROM
          contents
        WHERE
          contents.id = $1 AND
          contents.status = 'published'
        UNION ALL
          SELECT
            contents.id,
            contents.parent_id
          FROM
            contents
          INNER JOIN
            children ON contents.parent_id = children.id
          WHERE
            contents.status = 'published'
      )
      SELECT
        count(children.id)::integer
      FROM
        children
      WHERE
        children.id NOT IN ($1);`,
      values: [values.where.id],
    };
    const results = await database.query(query, { transaction: options.transaction });
    return results.rows[0].count;
  }

  function validateWhereSchema(where) {
    const cleanValues = validator(where, {
      id: 'required',
    });

    return cleanValues;
  }
}

export default Object.freeze({
  findAll,
  findOne,
  findChildrenTree,
  findWithStrategy,
  create,
  update,
});
