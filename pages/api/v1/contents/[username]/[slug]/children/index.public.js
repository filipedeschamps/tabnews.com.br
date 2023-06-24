import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
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
  .use(cacheControl.swrMaxAge(10))
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const validatorStartTime = performance.now();
  const cleanValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanValues;

  console.log({ getChildrenValidationDuration: performance.now() - validatorStartTime, query: request.query });

  next();
}

async function getHandler(request, response) {
  const getChildrenStartTime = performance.now();
  const userTryingToGet = user.createAnonymous();

  const contentTreeFound = await content.findTree({
    where: {
      owner_username: request.query.username,
      slug: request.query.slug,
    },
  });

  if (!contentTreeFound?.length) {
    throw new NotFoundError({
      message: `O conteúdo informado não foi encontrado no sistema.`,
      action: 'Verifique se o "slug" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:CHILDREN:GET_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  const childrenFound = contentTreeFound[0].children;

  const filterOutputStartTime = performance.now();
  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:list', childrenFound);

  const getChildrenEndTime = performance.now();
  console.log({
    getChildrenDuration: getChildrenEndTime - getChildrenStartTime,
    filterOutputDuration: getChildrenEndTime - filterOutputStartTime,
    query: request.query,
  });

  return response.status(200).json(secureOutputValues);
}
