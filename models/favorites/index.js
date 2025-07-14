import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database.js';
import validator from 'models/validator.js';

async function create(favoriteData, options = {}) {
  const validFavoriteData = validateCreateSchema(favoriteData);

  const query = {
    text: `
      INSERT INTO favorites (user_id, content_id)
      VALUES ($1, $2)
      RETURNING *
    `,
    values: [validFavoriteData.user_id, validFavoriteData.content_id],
  };

  try {
    const result = await database.query(query, { transaction: options.transaction });
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ValidationError({
        message: 'Este conteúdo já está nos seus favoritos.',
        action: 'Verifique se o conteúdo já não foi favoritado anteriormente.',
        stack: new Error().stack,
        errorLocationCode: 'MODEL:FAVORITES:CREATE:DUPLICATE',
        key: 'favorite',
      });
    }
    throw error;
  }
}

async function remove(userId, contentId, options = {}) {
  const query = {
    text: `
      DELETE FROM favorites
      WHERE user_id = $1 AND content_id = $2
      RETURNING *
    `,
    values: [userId, contentId],
  };

  const result = await database.query(query, { transaction: options.transaction });

  if (result.rowCount === 0) {
    throw new NotFoundError({
      message: 'Favorito não encontrado.',
      action: 'Verifique se o conteúdo está realmente nos seus favoritos.',
      stack: new Error().stack,
      errorLocationCode: 'MODEL:FAVORITES:REMOVE:NOT_FOUND',
      key: 'favorite',
    });
  }

  return result.rows[0];
}

async function findByUser(userId, values = {}, options = {}) {
  const validValues = validateFindValues(values);

  const offset = (validValues.page - 1) * validValues.per_page;

  const query = {
    text: `
      WITH favorite_window AS (
        SELECT
          COUNT(*) OVER()::INTEGER as total_rows,
          id
        FROM favorites
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      )
      SELECT
        favorites.*,
        contents.id as content_id,
        contents.title,
        contents.slug,
        contents.status,
        contents.created_at as content_created_at,
        contents.published_at as content_published_at,
        users.username as content_owner_username,
        favorite_window.total_rows
      FROM favorites
      INNER JOIN favorite_window ON favorites.id = favorite_window.id
      INNER JOIN contents ON favorites.content_id = contents.id
      INNER JOIN users ON contents.owner_id = users.id
      ORDER BY favorites.created_at DESC
    `,
    values: [userId, validValues.per_page, offset],
  };

  const result = await database.query(query, { transaction: options.transaction });
  return result.rows;
}

async function findByContent(contentId, values = {}, options = {}) {
  const validValues = validateFindValues(values);

  const offset = (validValues.page - 1) * validValues.per_page;

  const query = {
    text: `
      WITH favorite_window AS (
        SELECT
          COUNT(*) OVER()::INTEGER as total_rows,
          id
        FROM favorites
        WHERE content_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      )
      SELECT
        favorites.*,
        users.username,
        users.id as user_id,
        favorite_window.total_rows
      FROM favorites
      INNER JOIN favorite_window ON favorites.id = favorite_window.id
      INNER JOIN users ON favorites.user_id = users.id
      ORDER BY favorites.created_at DESC
    `,
    values: [contentId, validValues.per_page, offset],
  };

  const result = await database.query(query, { transaction: options.transaction });
  return result.rows;
}

async function exists(userId, contentId, options = {}) {
  const query = {
    text: `
      SELECT EXISTS(
        SELECT 1 FROM favorites
        WHERE user_id = $1 AND content_id = $2
      ) as exists
    `,
    values: [userId, contentId],
  };

  const result = await database.query(query, { transaction: options.transaction });
  return result.rows[0].exists;
}

async function countByUser(userId, options = {}) {
  const query = {
    text: `
      SELECT COUNT(*) as count
      FROM favorites
      WHERE user_id = $1
    `,
    values: [userId],
  };

  const result = await database.query(query, { transaction: options.transaction });
  return parseInt(result.rows[0].count);
}

async function countByContent(contentId, options = {}) {
  const query = {
    text: `
      SELECT COUNT(*) as count
      FROM favorites
      WHERE content_id = $1
    `,
    values: [contentId],
  };

  const result = await database.query(query, { transaction: options.transaction });
  return parseInt(result.rows[0].count);
}

function validateCreateSchema(favoriteData) {
  return validator(favoriteData, {
    user_id: 'required',
    content_id: 'required',
  });
}

function validateFindValues(values) {
  return validator(values, {
    page: 'optional',
    per_page: 'optional',
  });
}

export default {
  create,
  remove,
  findByUser,
  findByContent,
  exists,
  countByUser,
  countByContent,
};