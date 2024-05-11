import nextConnect from 'next-connect';
import { randomUUID as uuidV4 } from 'node:crypto';

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
  .post(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    postValidationHandler,
    authorization.canRequest('create:sponsored_content'),
    postHandler,
  );

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    slug: 'optional',
    title: 'required',
    body: 'required',
    source_url: 'optional',
    deactivate_at: 'optional',
    create_sponsored_content_tabcash: 'required',
  });

  request.body = cleanValues;

  next();
}

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(
    userTryingToCreate,
    'create:sponsored_content',
    insecureInputValues,
  );

  secureInputValues.owner_id = userTryingToCreate.id;
  secureInputValues.id = uuidV4();

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: 'create:sponsored_content',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
        metadata: {
          id: secureInputValues.id,
        },
      },
      {
        transaction: transaction,
      },
    );

    const createdSponsoredContent = await sponsoredContent.create(secureInputValues, {
      eventId: currentEvent.id,
      transaction: transaction,
    });

    await transaction.query('COMMIT');

    const secureOutputValues = authorization.filterOutput(
      userTryingToCreate,
      'read:sponsored_content',
      createdSponsoredContent,
    );

    response.status(201).json(secureOutputValues);
  } catch (error) {
    await transaction.query('ROLLBACK');
    throw error;
  } finally {
    await transaction.release();
  }
}
