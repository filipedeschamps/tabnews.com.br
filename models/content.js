import { truncate } from '@tabnews/helpers';
import { randomUUID as uuidV4 } from 'node:crypto';
import slug from 'slug';

import { ForbiddenError, UnprocessableEntityError, ValidationError } from 'errors';
import database from 'infra/database.js';
import balance from 'models/balance.js';
import pagination from 'models/pagination.js';
import prestige from 'models/prestige';
import user from 'models/user.js';
import validator from 'models/validator.js';
import queries from 'queries/rankingQueries';

async function findAll(values = {}, options = {}) {
  values = validateValues(values);
  await replaceOwnerUsernameWithOwnerId(values);

  const query = {
    values: [],
  };

  if (!values.count) {
    const offset = (values.page - 1) * values.per_page;
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
  const whereClause = buildWhereClause(values.where);
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
      if (key === '$not_null') return;

      query.values.push(values.where[key]);
    });
  }
  const results = await database.query(query, { transaction: options.transaction });

  return results.rows;

  async function replaceOwnerUsernameWithOwnerId(values) {
    if (values.where?.owner_username) {
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
      $not_null: 'optional',
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
        ${!values.attributes?.exclude?.includes('body') ? 'contents.body,' : ''}
        contents.status,
        contents.type,
        contents.source_url,
        contents.created_at,
        contents.updated_at,
        contents.published_at,
        contents.deleted_at,
        contents.path,
        users.username as owner_username,
        content_window.total_rows,
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
      INNER JOIN
        content_window ON contents.id = content_window.id
      INNER JOIN
        users ON contents.owner_id = users.id
      LEFT JOIN LATERAL get_content_balance_credit_debit(contents.id) tabcoins_count ON true
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

        if (columnName === '$not_null') {
          const $notNullQuery = columnValue
            .map((notColumnName) => {
              return `contents.${notColumnName} IS NOT NULL`;
            })
            .join(' AND ');

          return `(${$notNullQuery})`;
        }

        globalIndex += 1;

        if (Array.isArray(columnValue)) {
          return `contents.${columnName}  = ANY ($${globalIndex})`;
        }

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
    options.total_rows = results.rows[0]?.total_rows;
    results.pagination = await getPagination(options);

    return results;
  }

  async function getOld(options = {}) {
    const results = {};

    options.order = 'published_at ASC';
    results.rows = await findAll(options);
    options.total_rows = results.rows[0]?.total_rows;
    results.pagination = await getPagination(options);

    return results;
  }

  async function getRelevant(values = {}) {
    const results = {};
    const options = {};

    if (!values.where?.owner_username && values.where?.parent_id === null) {
      options.strategy = 'relevant_global';
    }
    values.order = 'published_at DESC';

    const contentList = await findAll(values, options);

    if (options.strategy === 'relevant_global') {
      results.rows = contentList;
    } else {
      results.rows = rankContentListByRelevance(contentList);
    }

    values.total_rows = results.rows[0]?.total_rows;
    results.pagination = await getPagination(values, options);

    return results;
  }
}

async function getPagination(values, options) {
  values.count = true;
  values.total_rows = values.total_rows ?? (await findAll(values, options))[0]?.total_rows ?? 0;
  return pagination.get(values);
}

async function create(postedContent, options = {}) {
  populateSlug(postedContent);
  populateStatus(postedContent);
  const validContent = validateCreateSchema(postedContent);

  checkRootContentTitle(validContent);

  populatePublishedAtValue(null, validContent);

  const newContent = await runInsertQuery(validContent, {
    transaction: options.transaction,
  });

  throwIfSpecifiedParentDoesNotExist(postedContent, newContent);

  await creditOrDebitTabCoins(null, newContent, {
    eventId: options.eventId,
    transaction: options.transaction,
  });

  await updateTabCashBalance(null, newContent, {
    eventId: options.eventId,
    transaction: options.transaction,
  });

  const tabcoinsCount = await balance.getContentTabcoinsCreditDebit(
    {
      recipientId: newContent.id,
    },
    {
      transaction: options.transaction,
    },
  );
  newContent.tabcoins = tabcoinsCount.tabcoins;
  newContent.tabcoins_credit = tabcoinsCount.tabcoins_credit;
  newContent.tabcoins_debit = tabcoinsCount.tabcoins_debit;

  return newContent;

  async function runInsertQuery(content, options) {
    const query = {
      text: `
      WITH
        parent AS (
          SELECT
            owner_id,
            CASE 
              WHEN id IS NULL THEN ARRAY[]::uuid[]
              ELSE ARRAY_APPEND(path, id)
            END AS child_path
          FROM (SELECT 1) AS dummy
          LEFT JOIN contents
          ON id = $2
        ),
        inserted_content as (
          INSERT INTO
            contents (id, parent_id, owner_id, slug, title, body, status, source_url, published_at, type, path)
            SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, parent.child_path
            FROM parent
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
        inserted_content.type,
        inserted_content.source_url,
        inserted_content.created_at,
        inserted_content.updated_at,
        inserted_content.published_at,
        inserted_content.deleted_at,
        inserted_content.path,
        users.username as owner_username,
        parent.owner_id as parent_owner_id
      FROM
        inserted_content
      INNER JOIN
        users ON inserted_content.owner_id = users.id
      LEFT JOIN
        parent ON true
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
        content.type,
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

function getSlug(title) {
  if (!title) {
    return;
  }

  const generatedSlug = slug(truncate(title, 160), {
    trim: true,
  });

  return generatedSlug;
}

function populateStatus(postedContent) {
  postedContent.status = postedContent.status || 'draft';
}

function throwIfSpecifiedParentDoesNotExist(postedContent, newContent) {
  const existingParentId = newContent.path.at(-1);

  if (postedContent.parent_id && postedContent.parent_id !== existingParentId) {
    throw new ValidationError({
      message: `Você está tentando criar um comentário em um conteúdo que não existe.`,
      action: `Utilize um "parent_id" que aponte para um conteúdo existente.`,
      stack: new Error().stack,
      errorLocationCode: 'MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND',
      statusCode: 400,
      key: 'parent_id',
    });
  }
}

function parseQueryErrorToCustomError(error) {
  if (error.databaseErrorCode === database.errorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
    return new ValidationError({
      message: `O conteúdo enviado parece ser duplicado.`,
      action: `Utilize um "title" ou "slug" com começo diferente.`,
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
    id: 'required',
    parent_id: 'optional',
    owner_id: 'required',
    slug: 'required',
    title: 'optional',
    body: 'required',
    status: 'required',
    content_type: 'optional',
    source_url: 'optional',
  });

  if (cleanValues.status === 'deleted' || cleanValues.status === 'firewall') {
    throw new ValidationError({
      message: `Não é possível criar um novo conteúdo diretamente com status "${cleanValues.status}".`,
      key: 'status',
      type: 'any.only',
      errorLocationCode: 'MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:INVALID_STATUS',
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
  // and is not published now, example: "draft" -> "deleted"
  // or if it was deleted and is catch by firewall: "deleted" -> "firewall".
  if (
    oldContent &&
    ((!oldContent.published_at && newContent.status !== 'published') ||
      ['deleted', 'firewall'].includes(oldContent.status))
  ) {
    return;
  }

  // We should debit if the content was once "published", but now it is not.
  // 1) If content `tabcoins` is positive, we need to debit all tabcoins earning by the user.
  // 2) If content `tabcoins` is negative, we should debit the original tabcoin gained from the
  // creation of the content represented by `initialTabcoins`.
  if (oldContent?.published_at && newContent.status !== 'published') {
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
      },
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

    // We should not credit TabCoins to the user if the "type" is not "content".
    if (newContent.type !== 'content') {
      userEarnings = 0;
    }

    // We should not credit if the content has little or no value.
    if (newContent.body.split(/[a-z]{5,}/i, 6).length < 6) return;

    if (newContent.parent_id) {
      let parentOwnerId = newContent.parent_owner_id;

      if (parentOwnerId === undefined) {
        const queryParent = {
          text: `SELECT owner_id FROM contents WHERE id = $1;`,
          values: [newContent.parent_id],
        };
        const parentQueryResult = await database.query(queryParent, options);
        const parentContent = parentQueryResult.rows[0];
        parentOwnerId = parentContent.owner_id;
      }

      // We should not credit if the parent content is from the same user.
      if (parentOwnerId === newContent.owner_id) return;
    }
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
      },
    );
  }

  if (contentEarnings > 0) {
    await balance.create(
      {
        balanceType: 'content:tabcoin:initial',
        recipientId: newContent.id,
        amount: contentEarnings,
        originatorType: 'user',
        originatorId: newContent.owner_id,
      },
      {
        transaction: options.transaction,
      },
    );
  }
}

async function updateTabCashBalance(oldContent, newContent, options = {}) {
  if (newContent.type === 'content') {
    return;
  }

  const initialTabCash = 100;

  const userBalance = await balance.create(
    {
      balanceType: 'user:tabcash',
      recipientId: newContent.owner_id,
      amount: -initialTabCash,
      originatorType: options.eventId ? 'event' : 'content',
      originatorId: options.eventId ? options.eventId : newContent.id,
    },
    {
      transaction: options.transaction,
      withBalance: true,
    },
  );

  if (userBalance.total < 0) {
    throw new UnprocessableEntityError({
      message: `Não foi possível criar a publicação.`,
      action: `Você precisa de pelo menos ${Math.abs(initialTabCash)} TabCash para realizar esta ação.`,
      errorLocationCode: 'MODEL:CONTENT:UPDATE_TABCASH:NOT_ENOUGH',
    });
  }

  const contentBalance = await balance.create(
    {
      balanceType: 'ad:budget',
      recipientId: newContent.id,
      amount: initialTabCash,
      originatorType: 'user',
      originatorId: newContent.owner_id,
    },
    {
      transaction: options.transaction,
      withBalance: true,
    },
  );

  newContent.tabcash = contentBalance.total;
}

async function update(contentId, postedContent, options = {}) {
  const validPostedContent = validateUpdateSchema(postedContent);

  const oldContent =
    options.oldContent ??
    (await findOne(
      {
        where: {
          id: contentId,
        },
      },
      options,
    ));

  const newContent = { ...oldContent, ...validPostedContent };

  throwIfContentIsAlreadyDeleted(oldContent);
  throwIfContentPublishedIsChangedToDraft(oldContent, newContent);
  checkRootContentTitle(newContent);

  populatePublishedAtValue(oldContent, newContent);
  populateDeletedAtValue(newContent);

  const updatedContent = await runUpdateQuery(newContent, options);

  if (!options.skipBalanceOperations) {
    await creditOrDebitTabCoins(oldContent, updatedContent, {
      eventId: options.eventId,
      transaction: options.transaction,
    });
  }

  const tabcoinsCount = await balance.getContentTabcoinsCreditDebit(
    {
      recipientId: updatedContent.id,
    },
    {
      transaction: options.transaction,
    },
  );
  updatedContent.tabcoins = tabcoinsCount.tabcoins;
  updatedContent.tabcoins_credit = tabcoinsCount.tabcoins_credit;
  updatedContent.tabcoins_debit = tabcoinsCount.tabcoins_debit;

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
        updated_content.type,
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

async function confirmFirewallStatus(contentIds, options) {
  const query = {
    text: `
      WITH updated_contents AS (
        UPDATE contents SET
          status = 'deleted',
          deleted_at = CASE
            WHEN deleted_at IS NULL THEN (now() at time zone 'utc')
            ELSE deleted_at
          END
        WHERE
          id = ANY ($1)
        RETURNING
          *)
      
      SELECT
        updated_contents.*,
        tabcoins_count.total_balance as tabcoins,
        tabcoins_count.total_credit as tabcoins_credit,
        tabcoins_count.total_debit as tabcoins_debit,
        users.username as owner_username,
        (
          SELECT COUNT(*)
          FROM contents as children
          WHERE children.path @> ARRAY[updated_contents.id]
           AND children.status = 'published'
        ) as children_deep_count
      FROM
        updated_contents
      INNER JOIN
        users ON updated_contents.owner_id = users.id
      LEFT JOIN LATERAL
        get_content_balance_credit_debit(updated_contents.id) tabcoins_count ON true
      ;`,
    values: [contentIds],
  };

  const results = await database.query(query, options);
  return results.rows;
}

async function undoFirewallStatus(contentIds, options) {
  const query = {
    text: `
      WITH updated_contents AS (
        UPDATE contents SET
          status = CASE
            WHEN deleted_at IS NULL THEN 'published'
            ELSE 'deleted'
          END
        WHERE
          id = ANY ($1)
        RETURNING
          *
      )
  
      SELECT
        updated_contents.*,
        tabcoins_count.total_balance as tabcoins,
        tabcoins_count.total_credit as tabcoins_credit,
        tabcoins_count.total_debit as tabcoins_debit,
        users.username as owner_username,
        (
          SELECT COUNT(*)
          FROM contents as children
          LEFT JOIN updated_contents as uc ON children.id = uc.id
          WHERE children.path @> ARRAY[updated_contents.id]
           AND COALESCE(uc.status, children.status) = 'published'
        ) as children_deep_count
      FROM
        updated_contents
      INNER JOIN
        users ON updated_contents.owner_id = users.id
      LEFT JOIN LATERAL
        get_content_balance_credit_debit(updated_contents.id) tabcoins_count ON true
      ;`,
    values: [contentIds],
  };

  const results = await database.query(query, options);
  return results.rows;
}

function validateUpdateSchema(content) {
  const cleanValues = validator(content, {
    slug: 'optional',
    title: 'optional',
    body: 'optional',
    status: 'optional',
    source_url: 'optional',
  });

  if (cleanValues.status === 'firewall') {
    throw new ValidationError({
      message: 'Não é possível atualizar um conteúdo para o status "firewall".',
      key: 'status',
      type: 'any.only',
      errorLocationCode: 'MODEL:CONTENT:VALIDATE_UPDATE_SCHEMA:INVALID_STATUS',
    });
  }

  return cleanValues;
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

async function findTree(options = {}) {
  options.where = validateWhereSchema(options.where);
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
        tabcoins_count.total_balance as tabcoins,
        tabcoins_count.total_credit as tabcoins_credit,
        tabcoins_count.total_debit as tabcoins_debit
      FROM
        contents
      INNER JOIN
        users ON owner_id = users.id
      LEFT JOIN LATERAL
        get_content_balance_credit_debit(c.id) tabcoins_count ON true
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
        tabcoins_count.total_balance as tabcoins,
        tabcoins_count.total_credit as tabcoins_credit,
        tabcoins_count.total_debit as tabcoins_debit
      FROM
        parent
      INNER JOIN
        users ON parent.owner_id = users.id
      LEFT JOIN LATERAL
        get_content_balance_credit_debit(parent.id) tabcoins_count ON true

      UNION ALL

      SELECT
        c.*,
        users.username as owner_username,
        tabcoins_count.total_balance as tabcoins,
        tabcoins_count.total_credit as tabcoins_credit,
        tabcoins_count.total_debit as tabcoins_debit
      FROM
        contents c
      INNER JOIN
        parent ON c.path @> ARRAY[parent.id]::uuid[]
      INNER JOIN
        users ON c.owner_id = users.id
      LEFT JOIN LATERAL
        get_content_balance_credit_debit(c.id) tabcoins_count ON true
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
    const options = {};

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
      } else {
        let currentNode = row;
        let parentId = currentNode.parent_id;

        while (parentId && !table[parentId]) {
          table[parentId] = {
            id: parentId,
            children: [currentNode],
            path: currentNode.path.slice(0, -1),
            parent_id: currentNode.path.at(-2) || null,
          };
          currentNode = table[parentId];
          parentId = currentNode.parent_id;
        }

        if (parentId) {
          table[parentId].children.push(currentNode);
        }
      }
    });

    recursiveInjectChildrenDeepCount(tree);

    return tree.children;

    function recursiveInjectChildrenDeepCount(node) {
      let count = 0;

      for (const child of node.children) {
        if (child.status === 'published') count++;
      }

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
  if (contentObject.status !== 'published') {
    return -10;
  }

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
  confirmFirewallStatus,
  undoFirewallStatus,
  creditOrDebitTabCoins,
});
