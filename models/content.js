import { v4 as uuidV4 } from 'uuid';
import slug from 'slug';
import database from 'infra/database.js';
import validator from 'models/validator.js';
import user from 'models/user.js';
import { ValidationError, NotFoundError } from 'errors/index.js';

async function findOneById(contentId) {
  const query = {
    text: `SELECT * FROM contents
            WHERE
              id = $1`,
    values: [contentId],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function findOneByUserIdAndSlug(userId, slug) {
  const query = {
    text: `SELECT * FROM contents
            WHERE
              owner_id = $1
              AND slug = $2
              LIMIT 1;`,
    values: [userId, slug],
  };

  const results = await database.query(query);
  return results.rows[0];
}

async function findOneByUsernameAndSlug(username, slug) {
  const userOwner = await user.findOneByUsername(username);

  const query = {
    text: `SELECT
              contents.id as id,
              contents.owner_id as owner_id,
              contents.parent_id as parent_id,
              contents.slug as slug,
              contents.title as title,
              contents.body as body,
              contents.status as status,
              contents.source_url as source_url,
              contents.created_at as created_at,
              contents.updated_at as updated_at,
              contents.published_at as published_at,
              users.username as username
            FROM
              contents
            INNER JOIN
              users ON contents.owner_id = users.id
            WHERE
              owner_id = $1
              AND slug = $2
            LIMIT 1
            ;`,
    values: [userOwner.id, slug],
  };

  const results = await database.query(query);

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: `O conteúdo informado não foi encontrado no sistema.`,
      action: 'Verifique se o "slug" está digitado corretamente.',
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:CONTENT:FIND_ONE_BY_USERNAME_AND_SLUG:CONTENT_NOT_FOUND',
      key: 'slug',
    });
  }

  return results.rows[0];
}

async function findAll(options = {}) {
  options.parent_id = options.parent_id || null;
  options.strategy = options.strategy || 'descending';

  return await strategies[options.strategy](options);
}

const strategies = {
  descending: getDescending,
  ascending: getAscending,
};

async function getDescending(options = {}) {
  const query = {
    text: `SELECT
              contents.id as id,
              contents.owner_id as owner_id,
              contents.parent_id as parent_id,
              contents.slug as slug,
              contents.title as title,
              contents.body as body,
              contents.status as status,
              contents.source_url as source_url,
              contents.created_at as created_at,
              contents.updated_at as updated_at,
              contents.published_at as published_at,
              users.username as username
            FROM
              contents
            INNER JOIN
              users ON contents.owner_id = users.id
            WHERE
            contents.parent_id IS NOT DISTINCT FROM $1
              AND contents.status = 'published'
            ORDER BY
            contents.published_at DESC;`,
    values: [options.parent_id],
  };
  const results = await database.query(query);
  return results.rows;
}

async function getAscending(options = {}) {
  const query = {
    text: `SELECT
              contents.id as id,
              contents.owner_id as owner_id,
              contents.parent_id as parent_id,
              contents.slug as slug,
              contents.title as title,
              contents.body as body,
              contents.status as status,
              contents.source_url as source_url,
              contents.created_at as created_at,
              contents.updated_at as updated_at,
              contents.published_at as published_at,
              users.username as username
            FROM
              contents
            INNER JOIN
              users
            ON
              contents.owner_id = users.id
            WHERE
            contents.parent_id IS NOT DISTINCT FROM $1
              AND contents.status = 'published'
            ORDER BY
            contents.published_at ASC;`,
    values: [options.parent_id],
  };
  const results = await database.query(query);
  return results.rows;
}

async function create(postedContent) {
  populateSlug(postedContent);
  populateStatus(postedContent);
  const validContent = validateCreateSchema(postedContent);

  checkRootContentTitle(validContent);

  if (validContent.parent_id) {
    await checkIfParentIdExists(validContent);
  }

  await checkForContentUniqueness(validContent);
  await populatePublishedAtValue(validContent);

  const newContent = await runInsertQuery(validContent);
  return newContent;

  async function runInsertQuery(content) {
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
        users.username as username
      FROM
        inserted_content
      INNER JOIN
        users
      ON
        inserted_content.owner_id = users.id;
      `,
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
    const results = await database.query(query);
    return results.rows[0];
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

async function checkIfParentIdExists(content) {
  const existingContent = await findOneById(content.parent_id);

  if (!existingContent) {
    throw new ValidationError({
      message: `Você está tentando criar ou atualizar um sub-conteúdo para um conteúdo que não existe.`,
      action: `Utilize um "parent_id" que aponte para um conteúdo que existe.`,
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:CONTENT:CHECK_IF_PARENT_ID_EXISTS:NOT_FOUND',
      statusCode: 422,
      key: 'parent_id',
    });
  }
}

async function checkForContentUniqueness(content) {
  const existingContent = await findOneByUserIdAndSlug(content.owner_id, content.slug);

  if (existingContent) {
    throw new ValidationError({
      message: `O conteúdo enviado parece ser duplicado.`,
      action: `Utilize um "slug" diferente de "${existingContent.slug}".`,
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS',
      statusCode: 422,
      key: 'slug',
    });
  }
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

  return cleanValues;
}

function checkRootContentTitle(content) {
  if (!content.parent_id && !content.title) {
    throw new ValidationError({
      message: `"title" é um campo obrigatório para conteúdos raiz.`,
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:CONTENT:CHECK_ROOT_CONTENT_TITLE:MISSING_TITLE',
      statusCode: 400,
      key: 'title',
    });
  }
}

async function populatePublishedAtValue(postedContent) {
  const existingContent = await findOneByUserIdAndSlug(postedContent.owner_id, postedContent.slug);

  if (existingContent && existingContent.published_at) {
    postedContent.published_at = existingContent.published_at;
    return;
  }

  if (existingContent && !existingContent.published_at && postedContent.status === 'published') {
    postedContent.published_at = new Date();
    return;
  }

  if (!existingContent && postedContent.status === 'published') {
    postedContent.published_at = new Date();
    return;
  }
}

async function update(contentId, postedContent) {
  const validPostedContent = validateUpdateSchema(postedContent);
  const oldContent = await findOneById(contentId);
  const newContent = { ...oldContent, ...validPostedContent };

  checkRootContentTitle(newContent);
  checkForParentIdRecursion(newContent);

  if (newContent.parent_id) {
    await checkIfParentIdExists(newContent);
  }

  await populatePublishedAtValue(newContent);

  const updatedContent = await runUpdateQuery(newContent);
  return updatedContent;

  async function runUpdateQuery(content) {
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
            updated_at = (now() at time zone 'utc')
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
        users.username as username
      FROM
        updated_content
      INNER JOIN
        users
      ON
        updated_content.owner_id = users.id;
      `,
      values: [
        content.id,
        content.parent_id,
        content.slug,
        content.title,
        content.body,
        content.status,
        content.source_url,
        content.published_at,
      ],
    };
    const results = await database.query(query);
    return results.rows[0];
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
      errorUniqueCode: 'MODEL:CONTENT:CHECK_FOR_PARENT_ID_RECURSION:RECURSION_FOUND',
      statusCode: 422,
      key: 'parent_id',
    });
  }
}

export default Object.freeze({
  findAll,
  create,
  update,
  findOneById,
  findOneByUserIdAndSlug,
  findOneByUsernameAndSlug,
});
