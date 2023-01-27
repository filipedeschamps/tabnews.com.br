import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';
import notification from 'models/notification.js';
import event from 'models/event.js';
import firewall from 'models/firewall.js';
import user from 'models/user.js';
import database from 'infra/database.js';
import { ForbiddenError } from 'errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .get(getValidationHandler, getHandler)
  .post(
    authentication.injectAnonymousOrUser,
    controller.logRequest,
    postValidationHandler,
    authorization.canRequest('create:content'),
    firewallValidationHandler,
    postHandler
  );

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    page: 'optional',
    per_page: 'optional',
    strategy: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = user.createAnonymous();

  const results = await content.findWithStrategy({
    strategy: request.query.strategy,
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const contentList = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

  controller.injectPaginationHeaders(results.pagination, '/api/v1/contents', response);

  response.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate');

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

async function firewallValidationHandler(request, response, next) {
  if (!request.body.parent_id) {
    return firewall.canRequest('create:content:text_root')(request, response, next);
  }

  return firewall.canRequest('create:content:text_child')(request, response, next);
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
        errorLocationCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_root', insecureInputValues);
  }

  if (insecureInputValues.parent_id) {
    if (!authorization.can(userTryingToCreate, 'create:content:text_child', insecureInputValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para criar conteúdos dentro de outros conteúdos.',
        action: 'Verifique se você possui a feature "create:content:text_child".',
        errorLocationCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_child', insecureInputValues);
  }

  secureInputValues.owner_id = userTryingToCreate.id;

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: secureInputValues.parent_id ? 'create:content:text_child' : 'create:content:text_root',
        originatorUserId: request.context.user.id,
        originatorIp: request.context.clientIp,
      },
      {
        transaction: transaction,
      }
    );

    const createdContent = await content.create(secureInputValues, {
      eventId: currentEvent.id,
      transaction: transaction,
    });

    await event.updateMetadata(
      currentEvent.id,
      {
        metadata: {
          id: createdContent.id,
        },
      },
      {
        transaction: transaction,
      }
    );

    await transaction.query('COMMIT');
    await transaction.release();

    if (createdContent.parent_id) {
      await notification.sendReplyEmailToParentUser(createdContent);
    }

    const secureOutputValues = authorization.filterOutput(userTryingToCreate, 'read:content', createdContent);

    return response.status(201).json(secureOutputValues);
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }
}
