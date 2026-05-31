import { createRouter } from 'next-connect';

import { NotFoundError } from 'errors';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(10))
  .get(getValidationHandler, getHandler)
  .handler(controller.handlerOptions);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanValues;

  return next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const contentFound = await content.findOne({
    where: {
      owner_username: request.query.username,
      slug: request.query.slug,
      status: 'published',
    },
  });

  if (!contentFound) {
    throw new NotFoundError({
      message: `O conteúdo informado não foi encontrado no sistema.`,
      action: 'Verifique se o "slug" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:ROOT:GET_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  if (!contentFound.parent_id) {
    throw new NotFoundError({
      message: `O conteúdo requisitado é um conteúdo raiz.`,
      action:
        'Busque apenas por conteúdos com "parent_id", pois este conteúdo não possui níveis superiores na árvore de conteúdos.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:ROOT:GET_HANDLER:ALREADY_ROOT',
      key: 'parent_id',
    });
  }

  const rootContentFound = await content.findOne({
    where: {
      id: contentFound.path[0],
    },
  });

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content', rootContentFound);

  return response.status(200).json(secureOutputValues);
}
