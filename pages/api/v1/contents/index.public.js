import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import content from 'models/content.js';
import notification from 'models/notification.js';
import { ForbiddenError, NotFoundError } from 'errors/index.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getValidationHandler, getHandler)
  .post(postValidationHandler, authorization.canRequest('create:content'), postHandler);

function getValidationHandler(request, response, next) {
  if (!request.query) {
    next();

    return;
  }

  if (Object.entries(request.query).length === 0) {
    next();

    return;
  }

  const cleanValues = validator(request.query, {
    id: 'optional',
  });

  request.query = cleanValues;

  next();
}

// TODO: cache the response
async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  const queryValues = request.query;

  if (queryValues.id) {
    const contentFound = await content.findOne({
      where: {
        id: queryValues.id,
        status: 'published',
      },
    });

    if (!contentFound) {
      throw new NotFoundError({
        message: `O conteúdo informado não foi encontrado no sistema.`,
        action: 'Verifique se "id" está digitado corretamente.',
        stack: new Error().stack,
        errorUniqueCode: 'CONTROLLER:CONTENT:GET_HANDLER:ID_NOT_FOUND',
        key: 'id',
      });
    }

    const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content', contentFound);

    return response.status(200).json(secureOutputValues);
  }

  const contentList = await content.findWithStrategy({
    strategy: 'descending',
    where: {
      parent_id: null,
      status: 'published',
    },
  });

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

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

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;

  let secureInputValues;

  if (!insecureInputValues.parent_id) {
    if (!authorization.can(userTryingToCreate, 'create:content:text_root', insecureInputValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para criar conteúdos na raiz do site.',
        action: 'Verifique se você possui a feature "create:content:text_root".',
        errorUniqueCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_ROOT:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_root', insecureInputValues);
  }

  if (insecureInputValues.parent_id) {
    if (!authorization.can(userTryingToCreate, 'create:content:text_child', insecureInputValues)) {
      throw new ForbiddenError({
        message: 'Você não possui permissão para criar conteúdos dentro de outros conteúdos.',
        action: 'Verifique se você possui a feature "create:content:text_child".',
        errorUniqueCode: 'CONTROLLER:CONTENT:POST_HANDLER:CREATE:CONTENT:TEXT_CHILD:FEATURE_NOT_FOUND',
      });
    }

    secureInputValues = authorization.filterInput(userTryingToCreate, 'create:content:text_child', insecureInputValues);
  }

  secureInputValues.owner_id = userTryingToCreate.id;

  const createdContent = await content.create(secureInputValues);

  if (createdContent.parent_id) {
    if (createdContent.status === 'published') {
      const parentContent = await content.findOne({
        where: {
          id: createdContent.parent_id,
        },
      });

      await notification.create({
        content_id: createdContent.id,
        type: 'content',
        receiver_id: parentContent.owner_id,
      });
    }
  }

  const secureOutputValues = authorization.filterOutput(userTryingToCreate, 'read:content', createdContent);

  return response.status(201).json(secureOutputValues);
}
