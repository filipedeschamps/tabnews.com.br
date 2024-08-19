import nextConnect from 'next-connect';
import { randomUUID as uuidV4 } from 'node:crypto';

import { ForbiddenError } from 'errors';
import database from 'infra/database.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import event from 'models/event.js';
import firewall from 'models/firewall';
import notification from 'models/notification.js';
import removeMarkdown from 'models/remove-markdown';
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
  .post(
    cacheControl.noCache,
    authentication.injectAnonymousOrUser,
    postValidationHandler,
    authorization.canRequest('create:content'),
    firewallValidationHandler,
    postHandler,
  );

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    page: 'optional',
    per_page: 'optional',
    strategy: 'optional',
    with_root: 'optional',
    with_children: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = user.createAnonymous();

  const results = await content.findWithStrategy({
    strategy: request.query.strategy,
    where: {
      parent_id: request.query.with_children ? undefined : null,
      status: 'published',
      type: 'content',
      $not_null: request.query.with_root === false ? ['parent_id'] : undefined,
    },
    attributes: {
      exclude: request.query.with_children ? undefined : ['body'],
    },
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const contentList = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

  if (request.query.with_children) {
    for (const content of secureOutputValues) {
      if (content.parent_id) {
        content.body = removeMarkdown(content.body, { maxLength: 255 });
      } else {
        delete content.body;
      }
    }
  }

  controller.injectPaginationHeaders(results.pagination, '/api/v1/contents', request, response);

  return response.status(200).json(secureOutputValues);
}

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    parent_id: 'optional',
    slug: 'optional',
    title: 'optional',
    body: 'required',
    status: 'optional',
    content_type: 'optional',
    source_url: 'optional',
  });

  request.body = cleanValues;

  next();
}

function firewallValidationHandler(request, response, next) {
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
    if (!authorization.can(userTryingToCreate, 'create:content:text_root')) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para criar conteúdos na raiz do site.',
        action: 'Verifique se você possui a feature "create:content:text_root".',
        errorLocationCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_root', insecureInputValues);
  } else {
    if (!authorization.can(userTryingToCreate, 'create:content:text_child')) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para criar conteúdos dentro de outros conteúdos.',
        action: 'Verifique se você possui a feature "create:content:text_child".',
        errorLocationCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_child', insecureInputValues);
  }

  secureInputValues.owner_id = userTryingToCreate.id;
  secureInputValues.id = uuidV4();

  const transaction = await database.transaction();

  try {
    await transaction.query('BEGIN');

    const currentEvent = await event.create(
      {
        type: secureInputValues.parent_id ? 'create:content:text_child' : 'create:content:text_root',
        originator_user_id: request.context.user.id,
        originator_ip: request.context.clientIp,
        metadata: {
          id: secureInputValues.id,
        },
      },
      {
        transaction: transaction,
      },
    );

    const createdContent = await content.create(secureInputValues, {
      eventId: currentEvent.id,
      transaction: transaction,
    });

    await transaction.query('COMMIT');
    await transaction.release();

    const secureOutputValues = authorization.filterOutput(userTryingToCreate, 'read:content', createdContent);
    const sendStream = !!insecureInputValues.parent_id && request.headers.accept?.includes('application/x-ndjson');

    response.status(201);

    if (sendStream) {
      response.setHeader('Content-Type', 'application/x-ndjson');
      response.write(JSON.stringify(secureOutputValues) + '\n');
    }

    if (createdContent.parent_id) {
      try {
        await notification.sendReplyEmailToParentUser(createdContent);
      } catch (error) {
        if (sendStream) throw error;
      }
    }

    if (sendStream) {
      response.end();
    } else {
      response.json(secureOutputValues);
    }
  } catch (error) {
    await transaction.query('ROLLBACK');
    await transaction.release();
    throw error;
  }
}
