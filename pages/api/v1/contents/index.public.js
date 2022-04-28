import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';
import { ForbiddenError } from 'errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getHandler)
  .post(postValidationHandler, authorization.canRequest('create:content'), postHandler);

// TODO: cache the response
async function getHandler(request, response) {
  const userTryingToList = request.context.user;
  const contentList = await content.findWithStrategy({
    strategy: 'descending',
    where: {
      parent_id: null,
      status: 'published',
    },
  });

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

  return response.status(200).json(secureOutputValues);
}

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    parent_id: 'optional',
    slug: 'optional',
    title: request.body.parent_id ? 'optional' : 'required',
    body: 'required',
    status: 'optional',
    source_url: 'optional',
  });

  request.body = cleanValues;

  next();
}

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;

  let secureInputValues;

  if (!insecureInputValues.parent_id) {
    if (!authorization.can(userTryingToCreate, 'create:content:text_root', insecureInputValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para criar conteúdos na raiz do site.',
        action: 'Verifique se você possui a feature "create:content:text_root".',
        errorUniqueCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_root', insecureInputValues);
  }

  if (insecureInputValues.parent_id) {
    if (!authorization.can(userTryingToCreate, 'create:content:text_child', insecureInputValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para criar conteúdos dentro de outros conteúdos.',
        action: 'Verifique se você possui a feature "create:content:text_child".',
        errorUniqueCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_child', insecureInputValues);
  }

  secureInputValues.owner_id = userTryingToCreate.id;

  const createdContent = await content.create(secureInputValues);

  const secureOutputValues = authorization.filterOutput(userTryingToCreate, 'read:content', createdContent);

  return response.status(201).json(secureOutputValues);
}
