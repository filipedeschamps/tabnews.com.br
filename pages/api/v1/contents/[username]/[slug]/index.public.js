import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';
import database from 'infra/database.js';
import event from 'models/event.js';
import { ForbiddenError, NotFoundError } from 'errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getValidationHandler, getHandler)
  .patch(patchValidationHandler, authorization.canRequest('update:content'), patchHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanValues;

  next();
}

// TODO: cache the response
async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

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

  const contentToBeUpdated = await content.findOne({
    where: {
      owner_username: request.query.username,
      slug: request.query.slug,
      $or: [{ status: 'draft' }, { status: 'published' }],
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

  let filteredBodyValues;

  if (!unfilteredBodyValues.parent_id) {
    if (!authorization.can(userTryingToPatch, 'create:content:text_root', unfilteredBodyValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para editar conteúdos na raiz do site.',
        action: 'Verifique se você possui a feature "create:content:text_root".',
        errorLocationCode: 'CONTROLLER:CONTENT:PATCH_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      });
    }

    filteredBodyValues = authorization.filterInput(userTryingToPatch, 'update:content', unfilteredBodyValues);
  }

  if (unfilteredBodyValues.parent_id) {
    if (!authorization.can(userTryingToPatch, 'create:content:text_child', unfilteredBodyValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para editar conteúdos dentro de outros conteúdos.',
        action: 'Verifique se você possui a feature "create:content:text_child".',
        errorLocationCode: 'CONTROLLER:CONTENT:PATCH_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      });
    }

    filteredBodyValues = authorization.filterInput(userTryingToPatch, 'update:content', unfilteredBodyValues);
  }

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: filteredBodyValues.parent_id ? 'update:content:text_child' : 'update:content:text_root',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
      },
      {
        transaction: transaction,
      }
    );

    const updatedContent = await content.update(contentToBeUpdated.id, filteredBodyValues, {
      eventId: currentEvent.id,
      transaction: transaction,
    });

    await event.updateMetadata(
      currentEvent.id,
      {
        metadata: {
          id: updatedContent.id,
        },
      },
      {
        transaction: transaction,
      }
    );

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
