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
  .get(getListValidationHandler, authorization.canRequest('update:user'), getListHandler)
  .post(postValidationHandler, authorization.canRequest('update:user'), postHandler)
  .delete(deleteValidationHandler, authorization.canRequest('update:user'), deleteHandler)
  .handler(controller.handlerOptions);

function getListValidationHandler(request, _, next) {
  const cleanQueryValues = validator(request.query, {
    page: 'optional',
    per_page: 'optional',
  });

  request.query = cleanQueryValues;

  return next();
}

async function getListHandler(request, response) {
  const { id: userId } = request.context.user;
  const { page, per_page } = request.query;

  const result = await favorites.findAll({
    user_id: userId,
    page: page,
    per_page: per_page,
  });

  return response.status(200).json(result);
}

function postValidationHandler(request, _, next) {
  const cleanBodyValues = validator(request.body, {
    content_id: 'required',
  });

  request.body = cleanBodyValues;

  return next();
}

async function postHandler(request, response) {
  const { id: userId } = request.context.user;
  const { content_id } = request.body;

  const result = await favorites.create({
    user_id: userId,
    content_id,
  });

  return response.status(201).json(result);
}

function deleteValidationHandler(request, _, next) {
  const cleanBodyValues = validator(request.body, {
    content_id: 'required',
  });

  request.body = cleanBodyValues;

  return next();
}

async function deleteHandler(request, response) {
  const { id: userId } = request.context.user;
  const { content_id } = request.body;

  const result = await favorites.remove({
    user_id: userId,
    content_id,
  });

  return response.status(200).json(result);
}
