import { createRouter } from 'next-connect';

import { ValidationError } from 'errors';
import authentication from 'models/authentication.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import favorites from 'models/favorites/index.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .post(cacheControl.noCache, authentication.injectAnonymousOrUser, postHandler)
  .handler(controller.handlerOptions);

async function postHandler(request, response) {
  const { user: currentUser } = request.context;

  if (!currentUser) {
    return response.status(401).json({
      name: 'UnauthorizedError',
      message: 'Usuário não autenticado.',
      action: 'Faça login para favoritar conteúdos.',
      status_code: 401,
      error_id: response.locals.error_id,
      request_id: response.locals.request_id,
      error_location_code: 'API:FAVORITES:INDEX:POST:UNAUTHORIZED',
    });
  }

  const { content_id } = request.body;

  if (!content_id) {
    return response.status(400).json({
      name: 'ValidationError',
      message: '"content_id" é um campo obrigatório.',
      action: 'Ajuste os dados enviados e tente novamente.',
      status_code: 400,
      error_id: response.locals.error_id,
      request_id: response.locals.request_id,
      error_location_code: 'API:FAVORITES:INDEX:POST:MISSING_CONTENT_ID',
      key: 'content_id',
    });
  }

  try {
    // Verificar se o conteúdo existe
    const contentExists = await content.findOne({ where: { id: content_id } });
    if (!contentExists) {
      return response.status(404).json({
        name: 'NotFoundError',
        message: 'Conteúdo não encontrado.',
        action: 'Verifique se o ID do conteúdo está correto.',
        status_code: 404,
        error_id: response.locals.error_id,
        request_id: response.locals.request_id,
        error_location_code: 'API:FAVORITES:INDEX:POST:CONTENT_NOT_FOUND',
      });
    }

    // Verificar se já está favoritado
    const alreadyFavorited = await favorites.exists(currentUser.id, content_id);
    if (alreadyFavorited) {
      return response.status(409).json({
        name: 'ValidationError',
        message: 'Este conteúdo já está nos seus favoritos.',
        action: 'Verifique se o conteúdo já não foi favoritado anteriormente.',
        status_code: 409,
        error_id: response.locals.error_id,
        request_id: response.locals.request_id,
        error_location_code: 'API:FAVORITES:INDEX:POST:ALREADY_FAVORITED',
        key: 'favorite',
      });
    }

    // Criar o favorito
    const favorite = await favorites.create({
      user_id: currentUser.id,
      content_id: content_id,
    });

    return response.status(201).json({
      id: favorite.id,
      user_id: favorite.user_id,
      content_id: favorite.content_id,
      created_at: favorite.created_at,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return response.status(400).json({
        name: error.name,
        message: error.message,
        action: error.action,
        status_code: 400,
        error_id: response.locals.error_id,
        request_id: response.locals.request_id,
        error_location_code: error.errorLocationCode,
        key: error.key,
      });
    }

    throw error;
  }
}