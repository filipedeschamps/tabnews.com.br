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
  // .get(getHandler)
  .patch(patchValidationHandler, authorization.canRequest('update:content'), patchHandler);

// TODO: cache the response
// async function getHandler(request, response) {
//   const userTryingToGet = request.context.user;
//   const contentList = await content.findAll();

//   const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content', contentList);

//   return response.status(200).json(secureOutputValues);
// }

function patchValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanQueryValues;

  const cleanBodyValues = validator(request.body, {
    parent_id: 'optional',
    slug: 'optional',
    title: 'optional',
    body: 'optional',
    status: 'optional',
    source_url: 'optional',
  });

  request.body = cleanBodyValues;

  next();
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const unfilteredBodyValues = request.body;
  const contentToBeUpdated = await content.findOneByUsernameAndSlug(request.query.username, request.query.slug);

  if (!authorization.can(userTryingToPatch, 'update:content', contentToBeUpdated)) {
    throw new ForbiddenError({
      message: 'Você não possui permissão para atualizar o conteúdo de outro usuário.',
      action: 'Verifique se você possui a feature "update:content:others".',
      errorUniqueCode: 'CONTROLLER:CONTENTS:PATCH:USER_CANT_UPDATE_CONTENT_FROM_OTHER_USER',
    });
  }

  let filteredBodyValues;

  if (!unfilteredBodyValues.parent_id) {
    if (!authorization.can(userTryingToPatch, 'create:content:text_root', unfilteredBodyValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para editar conteúdos na raiz do site.',
        action: 'Verifique se você possui a feature "create:content:text_root".',
        errorUniqueCode: 'CONTROLLER:CONTENT:PATCH_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      });
    }

    filteredBodyValues = authorization.filterInput(userTryingToPatch, 'update:content', unfilteredBodyValues);
  }

  if (unfilteredBodyValues.parent_id) {
    if (!authorization.can(userTryingToPatch, 'create:content:text_child', unfilteredBodyValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para editar conteúdos dentro de outros conteúdos.',
        action: 'Verifique se você possui a feature "create:content:text_child".',
        errorUniqueCode: 'CONTROLLER:CONTENT:PATCH_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      });
    }

    filteredBodyValues = authorization.filterInput(userTryingToPatch, 'update:content', unfilteredBodyValues);
  }

  const updatedContent = await content.update(contentToBeUpdated.id, filteredBodyValues);

  const secureOutputValues = authorization.filterOutput(userTryingToPatch, 'read:content', updatedContent);

  return response.status(200).json(secureOutputValues);
}
