import nextConnect from 'next-connect';

import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import event from 'models/event.js';
import firewall from 'models/firewall.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(getValidationHandler, authorization.canRequest('read:user:list'), getHandler)
  .post(
    postValidationHandler,
    authorization.canRequest('create:user'),
    firewall.canRequest('create:user'),
    postHandler,
  );

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    page: 'optional',
    per_page: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  const results = await user.findAllWithPagination({
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const userList = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:user:list', userList);

  controller.injectPaginationHeaders(results.pagination, '/api/v1/users', request, response);

  return response.status(200).json(secureOutputValues);
}

function postValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    username: 'required',
    email: 'required',
    password: 'required',
  });

  request.body = cleanValues;

  next();
}

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToCreate, 'create:user', insecureInputValues);

  const newUser = await user.create(secureInputValues);

  await event.create({
    type: 'create:user',
    originatorUserId: request.context.user.id || newUser.id,
    originatorIp: request.context.clientIp,
    metadata: {
      id: newUser.id,
    },
  });

  await activation.createAndSendActivationEmail(newUser);

  const secureOutputValues = authorization.filterOutput(newUser, 'read:user', newUser);

  return response.status(201).json(secureOutputValues);
}
