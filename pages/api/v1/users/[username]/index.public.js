import nextConnect from 'next-connect';

import { ForbiddenError, UnprocessableEntityError } from 'errors';
import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import ban from 'models/ban.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import event from 'models/event.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(cacheControl.swrMaxAge(10), getValidationHandler, getHandler)
  .patch(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    patchValidationHandler,
    authorization.canRequest('update:user'),
    patchHandler
  )
  .delete(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    deleteValidationHandler,
    authorization.canRequest('ban:user'),
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
  const userTryingToGet = user.createAnonymous();
  const userStoredFromDatabase = await user.findOneByUsername(request.query.username, {
    withBalance: true,
  });

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:user', userStoredFromDatabase);

  return response.status(200).json(secureOutputValues);
}

function patchValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanQueryValues;

  const cleanBodyValues = validator(request.body, {
    username: 'optional',
    email: 'optional',
    password: 'optional',
    description: 'optional',
    notifications: 'optional',
  });

  request.body = cleanBodyValues;

  next();
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const targetUsername = request.query.username;
  const targetUser = await user.findOneByUsername(targetUsername);
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToPatch, 'update:user', insecureInputValues);

  if (!authorization.can(userTryingToPatch, 'update:user', targetUser)) {
    throw new ForbiddenError({
      message: 'Você não possui permissão para atualizar outro usuário.',
      action: 'Verifique se você possui a feature "update:user:others".',
      errorLocationCode: 'CONTROLLER:USERS:USERNAME:PATCH:USER_CANT_UPDATE_OTHER_USER',
    });
  }

  // TEMPORARY BEHAVIOR
  // TODO: only let user update "password"
  // once we have double confirmation.
  delete secureInputValues.password;

  const updatedUser = await user.update(targetUsername, secureInputValues);

  const secureOutputValues = authorization.filterOutput(userTryingToPatch, 'read:user', updatedUser);

  return response.status(200).json(secureOutputValues);
}

function deleteValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    username: 'required',
  });

  request.query = cleanQueryValues;

  const cleanBodyValues = validator(request.body, {
    ban_type: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function deleteHandler(request, response) {
  const userTryingToDelete = request.context.user;
  const targetUsername = request.query.username;
  const targetUser = await user.findOneByUsername(targetUsername);
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToDelete, 'ban:user', insecureInputValues);

  if (targetUser.features.includes('nuked')) {
    throw new UnprocessableEntityError({
      message: 'Este usuário já está banido permanentemente.',
      action: 'Verifique se você está tentando banir permanentemente o usuário correto.',
      errorLocationCode: 'CONTROLLER:USERS:USERNAME:DELETE:USER_ALREADY_NUKED',
    });
  }

  const transaction = await database.transaction();
  let nukedUser;

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: 'ban:user',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
        metadata: {
          ban_type: secureInputValues.ban_type,
          user_id: targetUser.id,
        },
      },
      {
        transaction: transaction,
      }
    );

    if (secureInputValues.ban_type === 'nuke') {
      nukedUser = await ban.nuke(targetUser.id, {
        event: currentEvent,
        transaction: transaction,
      });
    }

    await transaction.query('COMMIT');
    await transaction.release();
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }

  const secureOutputValues = authorization.filterOutput(userTryingToDelete, 'read:user', nukedUser);

  return response.status(200).json(secureOutputValues);
}
