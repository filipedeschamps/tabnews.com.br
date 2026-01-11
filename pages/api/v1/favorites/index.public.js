import { createRouter } from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import favorites from 'models/favorites.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(getValidationHandler, authorization.canRequest('update:user'), getHandler)
  .post(postValidationHandler, authorization.canRequest('update:user'), postHandler)
  .delete(deleteValidationHandler, authorization.canRequest('update:user'), deleteHandler)
  .handler(controller.handlerOptions);

function getValidationHandler(request, _, next) {
  const { owner_id, slug } = request.query;

  if (owner_id || slug) {
    const cleanQueryValues = validator(request.query, {
      owner_id: 'required',
      slug: 'required',
    });

    request.query = {
      ...cleanQueryValues,
      type: 'check',
    };
  } else {
    const cleanQueryValues = validator(request.query, {
      page: 'optional',
      per_page: 'optional',
    });
    request.query = {
      ...cleanQueryValues,
      type: 'list',
    };
  }

  return next();
}

async function getHandler(request, response) {
  const { id: userId } = request.context.user;
  const { type, owner_id, slug, page, per_page } = request.query;

  if (type === 'check') {
    const result = await favorites.findOne({
      user_id: userId,
      owner_id: owner_id,
      slug: slug,
    });

    return response.status(200).json(result);
  }

  const result = await favorites.findAll({
    user_id: userId,
    page: page,
    per_page: per_page,
  });

  return response.status(200).json(result);
}

function postValidationHandler(request, _, next) {
  const cleanBodyValues = validator(request.body, {
    owner_id: 'required',
    slug: 'required',
  });

  request.body = cleanBodyValues;

  return next();
}

async function postHandler(request, response) {
  const { id: userId } = request.context.user;
  const { owner_id, slug } = request.body;

  const result = await favorites.create({
    user_id: userId,
    owner_id,
    slug,
  });

  return response.status(201).json(result);
}

function deleteValidationHandler(request, _, next) {
  const cleanBodyValues = validator(request.body, {
    owner_id: 'required',
    slug: 'required',
  });

  request.body = cleanBodyValues;

  return next();
}

async function deleteHandler(request, response) {
  const { id: userId } = request.context.user;
  const { owner_id, slug } = request.body;

  const result = await favorites.remove({
    user_id: userId,
    owner_id,
    slug,
  });

  return response.status(200).json(result);
}
