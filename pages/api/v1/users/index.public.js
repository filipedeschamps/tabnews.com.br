import nextConnect from 'next-connect';

import controller from 'models/controller.js';
import user from 'models/user.js';
import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getHandler)
  .post(postValidationHandler, authorization.canRequest('create:user'), postHandler);

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
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToCreate, 'create:user', insecureInputValues);

  const newUser = await user.create(secureInputValues);
  await activation.createAndSendActivationEmail(newUser);

  const secureOutputValues = authorization.filterOutput(newUser, 'read:user', newUser);

  return response.status(201).json(secureOutputValues);
}
