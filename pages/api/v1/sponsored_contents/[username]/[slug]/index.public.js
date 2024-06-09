import nextConnect from 'next-connect';

import { ForbiddenError, NotFoundError } from 'errors';
import database from 'infra/database';
import authentication from 'models/authentication';
import authorization from 'models/authorization';
import cacheControl from 'models/cache-control';
import controller from 'models/controller';
import event from 'models/event';
import sponsoredContent from 'models/sponsored-content';
import validator from 'models/validator';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .patch(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    patchValidationHandler,
    authorization.canRequest('update:sponsored_content'),
    patchHandler,
  );

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
    source_url: 'optional',
    deactivate_at: 'optional',
    create_sponsored_content_tabcash: 'optional',
  });

  request.body = cleanBodyValues;

  next();
}

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const unfilteredBodyValues = request.body;

  const sponsoredContentToBeUpdated = await sponsoredContent.findOne({
    owner_username: request.query.username,
    slug: request.query.slug,
  });

  const isDeactivated =
    sponsoredContentToBeUpdated?.deactivate_at && sponsoredContentToBeUpdated.deactivate_at < new Date();

  if (!sponsoredContentToBeUpdated || isDeactivated) {
    throw new NotFoundError({
      message: `A publicação patrocinada informada não foi encontrada no sistema.`,
      action: 'Verifique se o "slug" está digitado corretamente.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:SPONSORED_CONTENT:PATCH_HANDLER:SLUG_NOT_FOUND',
      key: 'slug',
    });
  }

  if (!authorization.can(userTryingToPatch, 'update:sponsored_content', sponsoredContentToBeUpdated)) {
    throw new ForbiddenError({
      message: 'Você não possui permissão para atualizar a publicação patrocinada de outro usuário.',
      action: 'Verifique se você possui a feature "update:sponsored_content:others".',
      errorLocationCode: 'CONTROLLER:SPONSORED_CONTENT:PATCH:USER_CANT_UPDATE_SPONSORED_CONTENT_FROM_OTHER_USER',
    });
  }

  const filteredSponsoredContentBodyValues = authorization.filterInput(
    userTryingToPatch,
    'update:sponsored_content',
    unfilteredBodyValues,
    sponsoredContentToBeUpdated,
  );

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: 'update:sponsored_content',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
        metadata: {
          id: sponsoredContent.id,
        },
      },
      {
        transaction: transaction,
      },
    );

    const updatedSponsoredContent = await sponsoredContent.update(
      {
        ...sponsoredContentToBeUpdated,
        ...filteredSponsoredContentBodyValues,
      },
      {
        eventId: currentEvent.id,
        transaction: transaction,
      },
    );

    await transaction.query('COMMIT');
    await transaction.release();

    const secureOutputValues = authorization.filterOutput(
      userTryingToPatch,
      'read:sponsored_content',
      updatedSponsoredContent,
    );

    return response.status(200).json(secureOutputValues);
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }
}
