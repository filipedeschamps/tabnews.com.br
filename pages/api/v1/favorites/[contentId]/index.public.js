import { createRouter } from 'next-connect';

import { NotFoundError } from 'errors';
import authentication from 'models/authentication.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import favorites from 'models/favorites/index.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .delete(cacheControl.noCache, authentication.injectAnonymousOrUser, delHandler)
  .handler(controller.handlerOptions);

async function delHandler(request, response) {
  const { user: currentUser } = request.context;
  const { contentId } = request.query;

  if (!currentUser) {
    return response.status(401).json({
      name: 'UnauthorizedError',
      message: 'Usuário não autenticado.',
      action: 'Faça login para desfavoritar conteúdos.',
      status_code: 401,
      error_id: response.locals.error_id,
      request_id: response.locals.request_id,
      error_location_code: 'API:FAVORITES:[CONTENTID]:DELETE:UNAUTHORIZED',
    });
  }

  if (!contentId) {
    return response.status(400).json({
      name: 'ValidationError',
      message: 'ID do conteúdo é obrigatório.',
      action: 'Ajuste os dados enviados e tente novamente.',
      status_code: 400,
      error_id: response.locals.error_id,
      request_id: response.locals.request_id,
      error_location_code: 'API:FAVORITES:[CONTENTID]:DELETE:MISSING_CONTENT_ID',
      key: 'contentId',
    });
  }

  try {
    // Verificar se o conteúdo existe
    const contentExists = await content.findOne({ where: { id: contentId } });
    if (!contentExists) {
      return response.status(404).json({
        name: 'NotFoundError',
        message: 'Conteúdo não encontrado.',
        action: 'Verifique se o ID do conteúdo está correto.',
        status_code: 404,
        error_id: response.locals.error_id,
        request_id: response.locals.request_id,
        error_location_code: 'API:FAVORITES:[CONTENTID]:DELETE:CONTENT_NOT_FOUND',
      });
    }

    // Verificar se está favoritado
    const isFavorited = await favorites.exists(currentUser.id, contentId);
    if (!isFavorited) {
      return response.status(404).json({
        name: 'NotFoundError',
        message: 'Favorito não encontrado.',
        action: 'Verifique se o conteúdo está realmente nos seus favoritos.',
        status_code: 404,
        error_id: response.locals.error_id,
        request_id: response.locals.request_id,
        error_location_code: 'API:FAVORITES:[CONTENTID]:DELETE:FAVORITE_NOT_FOUND',
      });
    }

    // Remover o favorito
    await favorites.remove(currentUser.id, contentId);

    return response.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      return response.status(404).json({
        name: error.name,
        message: error.message,
        action: error.action,
        status_code: 404,
        error_id: response.locals.error_id,
        request_id: response.locals.request_id,
        error_location_code: error.errorLocationCode,
        key: error.key,
      });
    }

    throw error;
  }
}