import { v4 as uuidV4 } from 'uuid';
import database from 'infra/database.js';
import validator from 'models/validator.js';
import slug from 'slug';
import { ValidationError } from 'errors/index.js';

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
    text: `SELECT * FROM contents
            WHERE
              parent_id IS NOT DISTINCT FROM $1
            ORDER BY
              created_at DESC;`,
    values: [options.parent_id],
  };
  const results = await database.query(query);
  return results.rows;
}

async function getAscending(options = {}) {
  const query = {
    text: `SELECT * FROM contents
            WHERE
              parent_id IS NOT DISTINCT FROM $1
            ORDER BY
              created_at ASC;`,
    values: [options.parent_id],
  };
  const results = await database.query(query);
  return results.rows;
}

async function create(postedContent) {
  const postedContentPopulated = populateMissingFields(postedContent);
  const validContent = await validateCreateSchema(postedContentPopulated);
  await checkForContentUniqueness(validContent);

  const newContent = await runInsertQuery(validContent);
  return newContent;

  async function runInsertQuery(content) {
    const query = {
      text: `INSERT INTO
              contents (parent_id, owner_id, slug, title, body, status, source_url)
              VALUES($1, $2, $3, $4, $5, $6, $7)
              RETURNING *;`,
      values: [
        content.parent_id,
        content.owner_id,
        content.slug,
        content.title,
        content.body,
        content.status,
        content.source_url,
      ],
    };
    const results = await database.query(query);
    return results.rows[0];
  }
}

function populateMissingFields(postedContent) {
  if (!postedContent.slug) {
    postedContent.slug = getSlug(postedContent.title) || uuidV4();
  }

  postedContent.status = postedContent.status || 'draft';
  return postedContent;
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
    '&': 'e',
  });

  const generatedSlug = slug(title, {
    trim: true,
  });

  const truncatedSlug = generatedSlug.substring(0, 256);

  return truncatedSlug;
}

async function checkForContentUniqueness(content) {
  const query = {
    text: 'SELECT id, slug FROM contents WHERE owner_id = $1 AND slug = $2;',
    values: [content.owner_id, content.slug],
  };

  const results = await database.query(query);

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: `O conteúdo enviado parece ser duplicado.`,
      action: `Utilize um "slug" diferente de "${results.rows[0].slug}".`,
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

  if (!cleanValues.parent_id && !cleanValues.title) {
    throw new ValidationError({
      message: `O conteúdo enviado não possui um título.`,
      stack: new Error().stack,
      errorUniqueCode: 'MODEL:CONTENT:VALIDATE_CREATE_SCHEMA:MISSING_TITLE_WITHOUT_PARENT_ID',
      statusCode: 400,
      key: 'title',
    });
  }

  return cleanValues;
}

export default Object.freeze({
  findAll,
  create,
});
