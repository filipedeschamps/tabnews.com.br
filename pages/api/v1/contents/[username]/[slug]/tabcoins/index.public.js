import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';
import event from 'models/event.js';
import database from 'infra/database.js';
import balance from 'models/balance.js';
import { NotFoundError, UnprocessableEntityError } from 'errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .post(postValidationHandler, authorization.canRequest('update:content'), postHandler);

function postValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    username: 'required',
    slug: 'required',
  });

  request.query = cleanQueryValues;

  const cleanBodyValues = validator(request.body, {
    transaction_type: 'required',
  });

  request.body = cleanBodyValues;

  next();
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;

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
      errorLocationCode: 'CONTROLLER:CONTENT:TABCOINS:CONTENT_NOT_FOUND',
      key: 'slug',
    });
  }

  if (userTryingToPost.id === contentFound.owner_id) {
    throw new UnprocessableEntityError({
      message: `Você não pode realizar esta operação em conteúdos de sua própria autoria.`,
      action: 'Realize esta operação em conteúdos de outros usuários.',
      stack: new Error().stack,
      errorLocationCode: 'CONTROLLER:CONTENT:TABCOINS:OWN_CONTENT',
      key: 'tabcoins',
    });
  }

  const transaction = await database.transaction();
  let currentContentTabCoinsBalance;

  try {
    await transaction.query('BEGIN');

    const tabCoinsRequiredAmount = 2;

    const currentEvent = await event.create(
      {
        type: 'update:content:tabcoins',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
        metadata: {
          transaction_type: request.body.transaction_type,
          from_user_id: userTryingToPost.id,
          content_owner_id: contentFound.owner_id,
          content_id: contentFound.id,
          amount: tabCoinsRequiredAmount,
        },
      },
      {
        transaction: transaction,
      }
    );

    currentContentTabCoinsBalance = await balance.rateContent(
      {
        contentId: contentFound.id,
        contentOwnerId: contentFound.owner_id,
        fromUserId: userTryingToPost.id,
        transactionType: request.body.transaction_type,
      },
      {
        eventId: currentEvent.id,
        transaction: transaction,
      }
    );

    await transaction.query('COMMIT');
    await transaction.release();
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    'read:content:tabcoins',
    currentContentTabCoinsBalance
  );

  return response.status(201).json(secureOutputValues);
}
