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

  const page = cleanValues.page || 1;
  const perPage = cleanValues.per_page || 15;
  const offset = (page - 1) * perPage;

  const countQuery = {
    text: `
      SELECT COUNT(*) as total
      FROM users_favorites usc
      INNER JOIN contents c ON c.owner_id = usc.owner_id 
        AND c.slug = usc.slug
        AND c.status = 'published'
      WHERE usc.user_id = $1;
    `,
    values: [cleanValues.user_id],
  };

  const countResult = await database.query(countQuery);
  const totalRows = parseInt(countResult.rows[0].total);

  const query = {
    text: `
      SELECT
        usc.slug,
        c.title,
        c.body,
        c.created_at,
        c.updated_at,
        c.published_at,
        tabcoins_count.total_balance as tabcoins,
        c.owner_id,
        u.username as owner_username,
        (
          SELECT COUNT(*)
          FROM contents as children
          WHERE children.path @> ARRAY[c.id]
          AND children.status = 'published'
        ) as children_deep_count
      FROM users_favorites usc
      INNER JOIN users u ON u.id = usc.owner_id
      INNER JOIN contents c ON c.owner_id = usc.owner_id 
        AND c.slug = usc.slug
        AND c.status = 'published'
      LEFT JOIN LATERAL get_content_balance_credit_debit(c.id) tabcoins_count ON true
      WHERE usc.user_id = $1
      ORDER BY usc.created_at DESC
      LIMIT $2 OFFSET $3;
    `,
    values: [cleanValues.user_id, perPage, offset],
  };

  const result = await database.query(query);

  const savedContents = result.rows.map((row) => ({
    id: row.id,
    owner_id: row.owner_id,
    owner_username: row.owner_username,
    slug: row.slug,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    tabcoins: Number(row.tabcoins),
  }));

  return {
    saved_contents: savedContents,
    total: totalRows,
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
    page: 'optional',
    per_page: 'optional',
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
