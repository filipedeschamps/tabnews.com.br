import { NotFoundError, ValidationError } from 'errors';
import database from 'infra/database.js';
import content from 'models/content.js';
import validator from 'models/validator.js';

async function findOne(values) {
  const cleanValues = validateFindSchema(values);

  const contentExists = await content.findOne({
    where: {
      owner_id: cleanValues.owner_id,
      slug: cleanValues.slug,
      status: 'published',
    },
  });

  if (!contentExists) {
    throw new NotFoundError({
      message: 'O conteúdo solicitado não pode ser encontrado.',
      action: 'Verifique se o conteúdo existe e está publicado.',
      errorLocationCode: 'MODEL:FAVORITES:FIND_ONE:CONTENT_NOT_FOUND',
    });
  }

  const query = {
    text: `
      SELECT EXISTS (
        SELECT 1 
        FROM users_favorites 
        WHERE user_id = $1 
          AND owner_id = $2 
          AND slug = $3
      ) as is_saved;
    `,
    values: [cleanValues.user_id, cleanValues.owner_id, cleanValues.slug],
  };

  const result = await database.query(query);
  const isSaved = result.rows[0]?.is_saved || false;

  return {
    is_saved: isSaved,
  };
}

async function findAll(values) {
  const cleanValues = validateFindAllSchema(values);

  const query = {
    text: `
      SELECT
        usc.slug,
        c.title,
        c.body,
        u.username as owner_username
      FROM users_favorites usc
      INNER JOIN users u ON u.id = usc.owner_id
      LEFT JOIN contents c ON c.owner_id = usc.owner_id 
        AND c.slug = usc.slug
        AND c.status = 'published'
      WHERE usc.user_id = $1
      ORDER BY usc.created_at DESC
      LIMIT 15;
    `,
    values: [cleanValues.user_id],
  };

  const result = await database.query(query);

  const savedContents = result.rows
    .filter((row) => row.title !== null)
    .map((row) => ({
      owner_username: row.owner_username,
      slug: row.slug,
      title: row.title,
      body: row.body,
    }));

  return {
    saved_contents: savedContents,
    total: savedContents.length,
  };
}

async function create(values) {
  const cleanValues = validateCreateSchema(values);

  if (cleanValues.user_id === cleanValues.owner_id) {
    throw new ValidationError({
      message: 'Você não pode salvar seus próprios conteúdos.',
      key: 'owner_id',
      errorLocationCode: 'MODEL:FAVORITES:CREATE:CANNOT_SAVE_OWN_CONTENT',
    });
  }

  const contentExists = await content.findOne({
    where: {
      owner_id: cleanValues.owner_id,
      slug: cleanValues.slug,
      status: 'published',
    },
  });

  if (!contentExists) {
    throw new NotFoundError({
      message: 'O conteúdo que você está tentando salvar não foi encontrado.',
      action: 'Verifique se o conteúdo existe e está publicado.',
      errorLocationCode: 'MODEL:FAVORITES:CREATE:CONTENT_NOT_FOUND',
    });
  }

  const alreadySaved = await findOne({
    user_id: cleanValues.user_id,
    owner_id: cleanValues.owner_id,
    slug: cleanValues.slug,
  });

  if (alreadySaved.is_saved) {
    throw new ValidationError({
      message: 'Este conteúdo já foi salvo anteriormente.',
      key: 'slug',
      errorLocationCode: 'MODEL:FAVORITES:CREATE:ALREADY_SAVED',
    });
  }

  const insertQuery = {
    text: `
      INSERT INTO users_favorites (user_id, owner_id, slug)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
    values: [cleanValues.user_id, cleanValues.owner_id, cleanValues.slug],
  };

  await database.query(insertQuery);

  return {
    is_saved: true,
  };
}

async function remove(values) {
  const cleanValues = validateRemoveSchema(values);

  const contentExists = await content.findOne({
    where: {
      owner_id: cleanValues.owner_id,
      slug: cleanValues.slug,
      status: 'published',
    },
  });

  if (!contentExists) {
    throw new NotFoundError({
      message: 'O conteúdo que você está tentando remover dos favoritos não foi encontrado.',
      action: 'Verifique se o conteúdo existe e está publicado.',
      errorLocationCode: 'MODEL:FAVORITES:REMOVE:CONTENT_NOT_FOUND',
    });
  }

  const isSaved = await findOne({
    user_id: cleanValues.user_id,
    owner_id: cleanValues.owner_id,
    slug: cleanValues.slug,
  });

  if (!isSaved.is_saved) {
    throw new NotFoundError({
      message: 'Este conteúdo não está salvo nos seus favoritos.',
      action: 'Verifique se você realmente salvou este conteúdo.',
      errorLocationCode: 'MODEL:FAVORITES:REMOVE:NOT_SAVED',
    });
  }

  const deleteQuery = {
    text: `
      DELETE FROM users_favorites
      WHERE user_id = $1 
        AND owner_id = $2 
        AND slug = $3
      RETURNING *;
    `,
    values: [cleanValues.user_id, cleanValues.owner_id, cleanValues.slug],
  };

  await database.query(deleteQuery);

  return {
    is_saved: false,
  };
}

function validateFindSchema(values) {
  return validator(values, {
    user_id: 'required',
    owner_id: 'required',
    slug: 'required',
  });
}

function validateFindAllSchema(values) {
  return validator(values, {
    user_id: 'required',
  });
}

function validateCreateSchema(values) {
  return validator(values, {
    user_id: 'required',
    owner_id: 'required',
    slug: 'required',
  });
}

function validateRemoveSchema(values) {
  return validator(values, {
    user_id: 'required',
    owner_id: 'required',
    slug: 'required',
  });
}

export default Object.freeze({
  findOne,
  findAll,
  create,
  remove,
});
