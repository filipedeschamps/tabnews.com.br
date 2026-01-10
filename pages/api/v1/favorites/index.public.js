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
  .post(postValidationHandler, authorization.canRequest('update:user'), postHandler)
  .handler(controller.handlerOptions);

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
