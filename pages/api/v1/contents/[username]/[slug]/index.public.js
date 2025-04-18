import { createRouter } from 'next-connect';

import { ForbiddenError, NotFoundError } from 'errors';
import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import event from 'models/event.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(cacheControl.swrMaxAge(10), getValidationHandler, getHandler)
  .patch(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    patchValidationHandler,
    authorization.canRequest('update:content'),
    patchHandler,
  )
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
      errorLocationCode: 'CONTROLLER:CONTENT:GET_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content', contentFound);

  return response.status(200).json(secureOutputValues);
}

function patchValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanQueryValues;

  const cleanBodyValues = validator(request.body, {
    slug: 'optional',
    title: 'optional',
    body: 'optional',
    status: 'optional',
    source_url: 'optional',
  });

  request.body = cleanBodyValues;

  return next();
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const unfilteredBodyValues = request.body;

  const contentToBeUpdated = await content.findOne({
    where: {
      owner_username: request.query.username,
      slug: request.query.slug,
      status: ['draft', 'published'],
    },
  });

  if (!contentToBeUpdated) {
    throw new NotFoundError({
      message: `O conteúdo informado não foi encontrado no sistema.`,
      action: 'Verifique se o "slug" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  if (!authorization.can(userTryingToPatch, 'update:content', contentToBeUpdated)) {
    throw new ForbiddenError({
      message: 'Você não possui permissão para atualizar o conteúdo de outro usuário.',
      action: 'Verifique se você possui a feature "update:content:others".',
      errorLocationCode: 'CONTROLLER:CONTENTS:PATCH:USER_CANT_UPDATE_CONTENT_FROM_OTHER_USER',
    });
  }

  if (!contentToBeUpdated.parent_id) {
    if (!authorization.can(userTryingToPatch, 'create:content:text_root')) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para editar conteúdos na raiz do site.',
        action: 'Verifique se você possui a feature "create:content:text_root".',
        errorLocationCode: 'CONTROLLER:CONTENT:PATCH_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      });
    }
  } else {
    if (!authorization.can(userTryingToPatch, 'create:content:text_child')) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para editar conteúdos dentro de outros conteúdos.',
        action: 'Verifique se você possui a feature "create:content:text_child".',
        errorLocationCode: 'CONTROLLER:CONTENT:PATCH_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      });
    }
  }

  const filteredBodyValues = authorization.filterInput(
    userTryingToPatch,
    'update:content',
    unfilteredBodyValues,
    contentToBeUpdated,
  );

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: contentToBeUpdated.parent_id ? 'update:content:text_child' : 'update:content:text_root',
        originator_user_id: request.context.user.id,
        originator_ip: request.context.clientIp,
        metadata: {
          id: contentToBeUpdated.id,
        },
      },
      {
        transaction: transaction,
      },
    );

    const updatedContent = await content.update(contentToBeUpdated.id, filteredBodyValues, {
      oldContent: contentToBeUpdated,
      eventId: currentEvent.id,
      transaction: transaction,
    });

    await transaction.query('COMMIT');
    await transaction.release();

    const secureOutputValues = authorization.filterOutput(userTryingToPatch, 'read:content', updatedContent);

    return response.status(200).json(secureOutputValues);
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }
}
