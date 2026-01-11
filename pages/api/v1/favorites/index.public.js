import { createRouter } from 'next-connect';

import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(getValidationHandler, authorization.canRequest('update:user'), getHandler)
  .post(postValidationHandler, authorization.canRequest('update:user'), postHandler)
  .handler(controller.handlerOptions);

function getValidationHandler(request, _, next) {
  const { owner_id, slug } = request.query;

  if (owner_id || slug) {
    const cleanQueryValues = validator(request.query, {
      owner_id: 'required',
      slug: 'required',
    });

    request.query = {
      ...cleanQueryValues,
      type: 'check',
    };
  } else {
    request.query = {
      type: 'list',
    };
  }

  next();
}

async function getHandler(request, response) {
  const { id: userId } = request.context.user;
  const { type, owner_id, slug } = request.query;

  if (type === 'check') {
    return await checkIfSaved(userId, owner_id, slug, response);
  } else {
    return await listSavedContents(userId, response);
  }
}

async function checkIfSaved(userId, ownerId, slug, response) {
  try {
    const contentExists = await content.findOne({
      where: {
        owner_id: ownerId,
        slug: slug,
        status: 'published',
      },
    });

    if (!contentExists) {
      return response.status(404).json({
        name: 'NotFoundError',
        message: 'O conteúdo solicitado não pode ser encontrado.',
        status_code: 404,
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
      values: [userId, ownerId, slug],
    };

    const result = await database.query(query);
    const isSaved = result.rows[0]?.is_saved || false;

    return response.status(200).json({
      is_saved: isSaved,
    });
  } catch (error) {
    return response.status(500).json({
      name: 'InternalServerError',
      message: error.message,
      status_code: 500,
    });
  }
}

async function listSavedContents(userId, response) {
  try {
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
      values: [userId],
    };

    const result = await database.query(query);

    const savedContents = result.rows
      .filter((row) => row.content_id !== null)
      .map((row) => ({
        owner_username: row.owner_username,
        slug: row.slug,
        title: row.title,
        body: row.body,
      }));

    return response.status(200).json({
      saved_contents: savedContents,
      total: savedContents.length,
    });
  } catch (error) {
    return response.status(500).json({
      name: 'InternalServerError',
      message: error.message,
      status_code: 500,
    });
  }
}

function postValidationHandler(request, _, next) {
  const cleanBodyValues = validator(request.body, {
    owner_id: 'required',
    slug: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function postHandler(request, response) {
  const { id: userId } = request.context.user;
  const { owner_id: ownerId, slug } = request.body;

  if (userId === ownerId) {
    return response.status(400).json({
      name: 'BadRequestError',
      message: 'Você não pode salvar seus próprios conteúdos.',
      status_code: 400,
    });
  }

  const contentExists = await content.findOne({
    where: {
      owner_id: ownerId,
      slug: slug,
      status: 'published',
    },
  });

  if (!contentExists) {
    return response.status(404).json({
      name: 'NotFoundError',
      message: 'O conteúdo que você está tentando salvar não foi encontrado.',
      status_code: 404,
    });
  }

  const checkQuery = {
    text: `
      SELECT EXISTS (
        SELECT 1 
        FROM users_favorites 
        WHERE user_id = $1 
          AND owner_id = $2 
          AND slug = $3
      ) as is_saved;
    `,
    values: [userId, ownerId, slug],
  };

  const checkResult = await database.query(checkQuery);
  const isAlreadySaved = checkResult.rows[0]?.is_saved || false;

  if (isAlreadySaved) {
    return response.status(400).json({
      name: 'BadRequestError',
      message: 'Este conteúdo já foi salvo anteriormente.',
      status_code: 400,
    });
  }

  try {
    const insertQuery = {
      text: `
        INSERT INTO users_favorites (user_id, owner_id, slug)
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      values: [userId, ownerId, slug],
    };

    await database.query(insertQuery);

    return response.status(201).json({
      is_saved: true,
    });
  } catch (error) {
    return response.status(500).json({
      name: 'InternalServerError',
      message: 'Erro ao salvar o conteúdo.',
      status_code: 500,
    });
  }
}
