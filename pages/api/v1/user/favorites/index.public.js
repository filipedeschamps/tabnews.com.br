import { createRouter } from 'next-connect';

import { ValidationError } from 'errors';
import authentication from 'models/authentication.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import favorites from 'models/favorites/index.js';
import pagination from 'models/pagination.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(cacheControl.noCache, authentication.injectAnonymousOrUser, getHandler)
  .handler(controller.handlerOptions);

async function getHandler(request, response) {
  const { user: currentUser } = request.context;
  const { page = 1, per_page = 30 } = request.query;

  if (!currentUser) {
    return response.status(401).json({
      name: 'UnauthorizedError',
      message: 'Usuário não autenticado.',
      action: 'Faça login para visualizar seus favoritos.',
      status_code: 401,
      error_id: response.locals.error_id,
      request_id: response.locals.request_id,
      error_location_code: 'API:USER:FAVORITES:GET:UNAUTHORIZED',
    });
  }

  try {
    const favoritesList = await favorites.findByUser(currentUser.id, {
      page: parseInt(page),
      per_page: parseInt(per_page),
    });

    const totalRows = favoritesList[0]?.total_rows || 0;
    const paginationData = pagination.get({
      page: parseInt(page),
      per_page: parseInt(per_page),
      total_rows: totalRows,
    });

    // Adicionar headers de paginação
    if (paginationData.first) {
      response.setHeader('Link', `<${paginationData.first}>; rel="first"`);
    }
    if (paginationData.last) {
      response.setHeader('Link', `${response.getHeader('Link') || ''}, <${paginationData.last}>; rel="last"`);
    }
    response.setHeader('X-Pagination-Total-Rows', totalRows.toString());

    return response.status(200).json(
      favoritesList.map((favorite) => ({
        id: favorite.id,
        content_id: favorite.content_id,
        title: favorite.title,
        slug: favorite.slug,
        status: favorite.status,
        content_created_at: favorite.content_created_at,
        content_published_at: favorite.content_published_at,
        content_owner_username: favorite.content_owner_username,
        created_at: favorite.created_at,
      })),
    );
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