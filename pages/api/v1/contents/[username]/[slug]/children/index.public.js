import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';
import { NotFoundError } from 'errors/index.js';
import user from 'models/user.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanValues;

  next();
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
      errorLocationCode: 'CONTROLLER:CONTENT:CHILDREN:GET_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  const childrenFound = await content.findTree({
    where: {
      parent_id: contentFound.id,
    },
  });

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:list', childrenFound);

  response.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate');

  return response.status(200).json(secureOutputValues);
}
