import nextConnect from 'next-connect';

import controller from 'models/controller.js';
import user from 'models/user.js';
import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import event from 'models/event.js';
import firewall from 'models/firewall.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  // `POST` is an anonymous request but it's important to
  // log it since this is a sensitive operation.
  .post(
    controller.injectRequestMetadata,
    controller.logRequest,
    postValidationHandler,
    firewall.canRequest('create:user'),
    postHandler
  )

  // `GET` requests needs to be authenticated.
  .get(
    controller.injectRequestMetadata,
    authentication.injectUser,
    controller.logRequest,
    authorization.canRequest('read:user:list'),
    getHandler
  );

async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  const userList = await user.findAll();

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:user:list', userList);

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
  const userTryingToCreate = user.createAnonymous();
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToCreate, 'create:user', insecureInputValues);

  const newUser = await user.create(secureInputValues);

  await event.create({
    type: 'create:user',
    originatorUserId: newUser.id,
    originatorIp: request.context.clientIp,
    metadata: {
      id: newUser.id,
    },
  });

  await activation.createAndSendActivationEmail(newUser);

  const secureOutputValues = authorization.filterOutput(newUser, 'read:user', newUser);

  return response.status(201).json(secureOutputValues);
}
