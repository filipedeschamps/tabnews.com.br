import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import { NotFoundError, ForbiddenError } from 'errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getValidationHandler, getHandler)
  .patch(
    authorization.canRequest('read:session'),
    authorization.canRequest('update:bookmarks'),
    patchValidationHandler,
    patchHandler
  )
  .delete(
    authorization.canRequest('read:session'),
    authorization.canRequest('update:bookmarks'),
    deleteValidationHandler,
    deleteHandler
  );

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const userStoredFromDatabase = await user.findOneByUsername(request.query.username);

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:bookmarks', userStoredFromDatabase);

  return response.status(200).json(secureOutputValues);
}

function patchValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanQueryValues;

  const cleanBodyValues = validator(request.body, {
    content_id: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function patchHandler(request, response) {
  var userTryingToPatch = request.context.user;
  var userToBeUpdated = await user.findOneByUsername(request.query.username);

  if (!userToBeUpdated) {
    throw new NotFoundError({
      message: `O usúario informado não foi encontrado no sistema.`,
      action: 'Verifique se o "username" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:USER:PATCH_HANDLER:USERNAME_NOT_FOUND',
      key: 'username',
    });
  }

  if (!authorization.can(userTryingToPatch, 'update:bookmarks', userToBeUpdated)) {
    throw new ForbiddenError({
      message: 'Você não possui permissão para atualizar o conteúdo de outro usuário.',
      action: 'Verifique se você possui a feature "update:bookmarks:others".',
      errorLocationCode: 'CONTROLLER:BOOKMARKS:PATCH:USER_CANT_UPDATE_BOOKMARKS_FROM_OTHER_USER',
    });
  }

  userToBeUpdated = await user.addBookmarks(userToBeUpdated.id, [...request.body.content_id]);
  let filteredBodyValues = await authorization.filterInput(userToBeUpdated, 'update:bookmarks', userToBeUpdated);
  return response.status(200).json(filteredBodyValues);
}

function deleteValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanQueryValues;

  const cleanBodyValues = validator(request.body, {
    content_id: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function deleteHandler(request, response) {
  var userTryingToPatch = request.context.user;
  var userToBeUpdated = await user.findOneByUsername(request.query.username);

  if (!userToBeUpdated) {
    throw new NotFoundError({
      message: `O usúario informado não foi encontrado no sistema.`,
      action: 'Verifique se o "username" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:USER:PATCH_HANDLER:USERNAME_NOT_FOUND',
      key: 'username',
    });
  }

  if (!authorization.can(userTryingToPatch, 'update:bookmarks', userToBeUpdated)) {
    throw new ForbiddenError({
      message: 'Você não possui permissão para atualizar o conteúdo de outro usuário.',
      action: 'Verifique se você possui a feature "update:bookmarks:others".',
      errorLocationCode: 'CONTROLLER:BOOKMARKS:PATCH:USER_CANT_UPDATE_BOOKMARKS_FROM_OTHER_USER',
    });
  }

  userToBeUpdated = await user.removeBookmarks(userToBeUpdated.id, [...request.body.content_id]);
  let filteredBodyValues = await authorization.filterInput(userToBeUpdated, 'update:bookmarks', userToBeUpdated);
  return response.status(200).json(filteredBodyValues);
}
