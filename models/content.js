import slug from 'slug';
import { v4 as uuidV4 } from 'uuid';

import { ForbiddenError, ValidationError } from 'errors';
import database from 'infra/database.js';
import balance from 'models/balance.js';
import prestige from 'models/prestige';
import user from 'models/user.js';
import validator from 'models/validator.js';
import queries from 'queries/rankingQueries';

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

  if (options.strategy === 'relevant_global') {
    query.text = queries.rankedContent;
    if (values.count) {
      query.values = [1, 0];
    }

    const relevantResults = await database.query(query, { transaction: options.transaction });

    return relevantResults.rows;
  }

  const selectClause = buildSelectClause(values);
  const whereClause = buildWhereClause(values?.where);
  const orderByClause = buildOrderByClause(values);

  query.text = `
      WITH content_window AS (
      SELECT
        COUNT(*) OVER()::INTEGER as total_rows,
        id
      FROM contents
      ${whereClause}
      ${orderByClause}

      ${values.count ? 'LIMIT 1' : 'LIMIT $1 OFFSET $2'}
      )
      ${selectClause}
      ${orderByClause}
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

  return results.rows;

  async function replaceOwnerUsernameWithOwnerId(values) {
    if (values?.where?.owner_username) {
      const userOwner = await user.findOneByUsername(values.where.owner_username);
      values.where.owner_id = userOwner.id;
      delete values.where.owner_username;
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
          total_rows
        FROM
          content_window
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
        contents.path,
        users.username as owner_username,
        content_window.total_rows,
        get_current_balance('content:tabcoin', contents.id) as tabcoins,
        (
          SELECT COUNT(*)
          FROM contents as children
          WHERE children.path @> ARRAY[contents.id]
           AND children.status = 'published'
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
    relevant: getRelevant,
  };

  return await strategies[options.strategy](options);

  async function getNew(options = {}) {
    const results = {};

    options.order = 'published_at DESC';
    results.rows = await findAll(options);
    options.totalRows = results.rows[0]?.total_rows;
    results.pagination = await getPagination(options);

    return results;
  }

  async function getOld(options = {}) {
    const results = {};

    options.order = 'published_at ASC';
    results.rows = await findAll(options);
    options.totalRows = results.rows[0]?.total_rows;
    results.pagination = await getPagination(options);

    return results;
  }

  async function getRelevant(values = {}) {
    const results = {};
    const options = {};

    if (!values?.where?.owner_username) {
      options.strategy = 'relevant_global';
    }
    values.order = 'published_at DESC';

    const contentList = await findAll(values, options);

    if (options.strategy === 'relevant_global') {
      results.rows = contentList;
    } else {
      results.rows = rankContentListByRelevance(contentList);
    }

    values.totalRows = results.rows[0]?.total_rows;
    results.pagination = await getPagination(values, options);

    return results;
  }
}

async function getPagination(values, options = {}) {
  values.count = true;

  const totalRows = values.totalRows ?? (await findAll(values, options))[0]?.total_rows ?? 0;
  const perPage = values.per_page;
  const firstPage = 1;
  const lastPage = Math.ceil(totalRows / values.per_page);
  const nextPage = values.page >= lastPage ? null : values.page + 1;
  const previousPage = values.page <= 1 ? null : values.page > lastPage ? lastPage : values.page - 1;
  const strategy = values.strategy;

  return {
    currentPage: values.page,
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

  const parentContent = validContent.parent_id
    ? await checkIfParentIdExists(validContent, {
        transaction: options.transaction,
      })
    : null;

  injectIdAndPath(validContent, parentContent);

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
            contents (id, parent_id, owner_id, slug, title, body, status, source_url, published_at, path)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        )
      SELECT
        inserted_content.id,
        inserted_content.owner_id,
        inserted_content.parent_id,
        inserted_content.slug,
        inserted_content.title,
        inserted_content.body,
        inserted_content.status,
        inserted_content.source_url,
        inserted_content.created_at,
        inserted_content.updated_at,
        inserted_content.published_at,
        inserted_content.deleted_at,
        inserted_content.path,
        users.username as owner_username
      FROM
        inserted_content
      INNER JOIN
        users ON inserted_content.owner_id = users.id
      ;`,
      values: [
        content.id,
        content.parent_id,
        content.owner_id,
        content.slug,
        content.title,
        content.body,
        content.status,
        content.source_url,
        content.published_at,
        content.path,
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

function injectIdAndPath(validContent, parentContent) {
  validContent.id = uuidV4();

  if (parentContent) {
    validContent.path = [...parentContent.path, parentContent.id];
  }

  if (!parentContent) {
    validContent.path = [];
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
    '&': ' e ',
    _: '-',
    '/': '-',
  });

  const generatedSlug = slug(title, {
    trim: true,
  });

  const truncatedSlug = generatedSlug.substring(0, 255);

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

  return existingContent;
}

function parseQueryErrorToCustomError(error) {
  if (error.databaseErrorCode === database.errorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
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
  let contentEarnings = 0;
  let userEarnings = 0;

  // We should not credit or debit if the content has never been published before
  // and is being directly deleted, example: "draft" -> "deleted".
  if (oldContent && !oldContent.published_at && newContent.status === 'deleted') {
    return;
  }

  // We should debit if the content was once "published", but now is being "deleted".
  // 1) If content `tabcoins` is positive, we need to debit all tabcoins earning by the user.
  // 2) If content `tabcoins` is negative, we should debit the original tabcoin gained from the
  // creation of the content represented by `initialTabcoins`.
  if (oldContent && oldContent.published_at && newContent.status === 'deleted') {
    let amountToDebit;

    const userEarningsByContent = await prestige.getByContentId(oldContent.id, { transaction: options.transaction });

    if (oldContent.tabcoins > 0) {
      amountToDebit = -userEarningsByContent.totalTabcoins;
    } else {
      amountToDebit = -userEarningsByContent.initialTabcoins;
    }

    if (!amountToDebit) return;

    await balance.create(
      {
        balanceType: 'user:tabcoin',
        recipientId: newContent.owner_id,
        amount: amountToDebit,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );
    return;
  }

  if (
    // We should credit if the content is being created directly with "published" status.
    (!oldContent && newContent.published_at) ||
    // We should credit if the content already existed and is now being published for the first time.
    (oldContent && !oldContent.published_at && newContent.status === 'published')
  ) {
    contentEarnings = 1;
    userEarnings = await prestige.getByUserId(newContent.owner_id, {
      isRoot: !newContent.parent_id,
      transaction: options.transaction,
    });

    if (userEarnings < 0) {
      throw new ForbiddenError({
        message: 'Não é possível publicar porque há outras publicações mal avaliadas que ainda não foram excluídas.',
        action: 'Exclua seus conteúdos mais recentes que estiverem classificados como não relevantes.',
        errorLocationCode: 'MODEL:CONTENT:CREDIT_OR_DEBIT_TABCOINS:NEGATIVE_USER_EARNINGS',
      });
    }

    if (newContent.parent_id) {
      const parentContent = await findOne(
        {
          where: {
            id: newContent.parent_id,
          },
        },
        options
      );

      // We should not credit if the parent content is from the same user.
      if (parentContent.owner_id === newContent.owner_id) return;
    }

    // We should not credit if the content has little or no value.
    // Expected 5 or more words with 5 or more characters.
    if (newContent.body.split(/[a-z]{5,}/i).length < 6) return;
  }

  if (userEarnings > 0) {
    await balance.create(
      {
        balanceType: 'user:tabcoin',
        recipientId: newContent.owner_id,
        amount: userEarnings,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );
  }

  if (contentEarnings > 0) {
    await balance.create(
      {
        balanceType: 'content:tabcoin',
        recipientId: newContent.id,
        amount: contentEarnings,
        originatorType: options.eventId ? 'event' : 'content',
        originatorId: options.eventId ? options.eventId : newContent.id,
      },
      {
        transaction: options.transaction,
      }
    );
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
  throwIfContentPublishedIsChangedToDraft(oldContent, newContent);
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

  if (!options.skipBalanceOperations) {
    await creditOrDebitTabCoins(oldContent, updatedContent, {
      eventId: options.eventId,
      transaction: options.transaction,
    });
  }

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
            slug = $2,
            title = $3,
            body = $4,
            status = $5,
            source_url = $6,
            published_at = $7,
            updated_at = (now() at time zone 'utc'),
            deleted_at = $8
          WHERE
            id = $1
          RETURNING *
        )
      SELECT
        updated_content.id,
        updated_content.owner_id,
        updated_content.parent_id,
        updated_content.slug,
        updated_content.title,
        updated_content.body,
        updated_content.status,
        updated_content.source_url,
        updated_content.created_at,
        updated_content.updated_at,
        updated_content.published_at,
        updated_content.deleted_at,
        updated_content.path,
        users.username as owner_username
      FROM
        updated_content
      INNER JOIN
        users ON updated_content.owner_id = users.id
      ;`,
      values: [
        content.id,
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

function throwIfContentPublishedIsChangedToDraft(oldContent, newContent) {
  if (oldContent.status === 'published' && newContent.status === 'draft') {
    throw new ValidationError({
      message: `Não é possível alterar para rascunho um conteúdo já publicado.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:CONTENT:CHECK_STATUS_CHANGE:STATUS_ALREADY_PUBLISHED',
      statusCode: 400,
      key: 'status',
    });
  }
}

async function findTree(options) {
  options.where = validateWhereSchema(options?.where);
  let values;
  if (options.where.parent_id) {
    values = [options.where.parent_id];
  } else if (options.where.id) {
    values = [options.where.id];
  } else if (options.where.slug) {
    values = [options.where.owner_username, options.where.slug];
  }

  const flatList = await databaseLookup(options);
  return flatListToTree(flatList);

  async function databaseLookup(options) {
    const queryChildrenByParentId = `
      SELECT
        *,
        users.username as owner_username,
        get_current_balance('content:tabcoin', contents.id) as tabcoins
      FROM
        contents
      INNER JOIN
        users ON owner_id = users.id
      WHERE
        path @> ARRAY[$1]::uuid[] AND
        status = 'published';`;

    const queryTree = `
      WITH parent AS (SELECT * FROM contents
        WHERE
          ${options.where.id ? 'contents.id = $1 AND' : ''}
          ${options.where.owner_username ? `${whereOwnerUsername('$1')} AND` : ''}
          ${options.where.slug ? 'contents.slug = $2 AND' : ''}
          contents.status = 'published')

      SELECT
        parent.*,
        users.username as owner_username,
        get_current_balance('content:tabcoin', parent.id) as tabcoins
      FROM
        parent
      INNER JOIN
        users ON parent.owner_id = users.id

      UNION ALL

      SELECT
        c.*,
        users.username as owner_username,
        get_current_balance('content:tabcoin', c.id) as tabcoins
      FROM
        contents c
      INNER JOIN
        parent ON c.path @> ARRAY[parent.id]::uuid[]
      INNER JOIN
        users ON c.owner_id = users.id
      WHERE
        c.status = 'published';`;

    const query = {
      text: options.where.parent_id ? queryChildrenByParentId : queryTree,
      values: values,
    };
    const results = await database.query(query);
    return results.rows;
  }

  function validateWhereSchema(where) {
    let options = {};

    if (where.parent_id) {
      options.parent_id = 'required';
    } else if (where.slug) {
      options.owner_username = 'required';
      options.slug = 'required';
    } else {
      options.id = 'required';
    }

    const cleanValues = validator(where, options);

    return cleanValues;
  }

  function flatListToTree(list) {
    const tree = { children: [] };
    const table = {};

    list.forEach((row) => {
      table[row.id] = row;
      table[row.id].children = [];
    });

    list.forEach((row) => {
      if (table[row.parent_id]) {
        table[row.parent_id].children.push(row);
      } else if (!row.path.some((id) => table[id])) {
        tree.children.push(row);
      }
    });

    recursiveInjectChildrenDeepCount(tree);

    return tree.children;

    function recursiveInjectChildrenDeepCount(node) {
      let count = node.children.length;

      if (node.children) {
        node.children = rankContentListByRelevance(node.children);
        node.children.forEach((child) => {
          count += recursiveInjectChildrenDeepCount(child);
        });
      }

      node.children_deep_count = count;
      return count;
    }
  }
}

function whereOwnerUsername($n) {
  return `
  contents.owner_id = (
    SELECT id FROM users
    WHERE
      LOWER(username) = LOWER(${$n})
    LIMIT 1)
  `;
}

function rankContentListByRelevance(contentList) {
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
}

// Inspired by:
// https://medium.com/hacking-and-gonzo/how-hacker-news-ranking-algorithm-works-1d9b0cf2c08d
// https://medium.com/hacking-and-gonzo/how-reddit-ranking-algorithms-work-ef111e33d0d9
const ageBaseInMilliseconds = 1000 * 60 * 60 * 6; // 6 hours
const boostPeriodInMilliseconds = 1000 * 60 * 10; // 10 minutes
const offset = 0.5;

function getContentScore(contentObject) {
  const tabcoins = contentObject.tabcoins;
  const ageInMilliseconds = Date.now() - new Date(contentObject.published_at);
  const initialBoost = ageInMilliseconds < boostPeriodInMilliseconds ? 3 : 1;
  const gravity = Math.exp(-ageInMilliseconds / ageBaseInMilliseconds);
  const score = (tabcoins - offset) * initialBoost;
  const finalScore = tabcoins > 0 ? score * (1 + gravity) : score * (1 - gravity);
  return finalScore;
}

export default Object.freeze({
  findAll,
  findOne,
  findTree,
  findWithStrategy,
  create,
  update,
});
