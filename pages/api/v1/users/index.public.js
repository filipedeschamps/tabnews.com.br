import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user.js';
import activation from 'models/activation.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .get(getHandler)
  .post(authorization.canRequest('create:user'), postHandler);

async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  const userList = await user.findAll();

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:user:list', userList);

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToCreate, 'create:user', insecureInputValues);

  const newUser = await user.create(secureInputValues);
  await activation.sendActivationEmailToUser(newUser);

  const secureOutputValues = authorization.filterOutput(newUser, 'read:user', newUser);

  return response.status(201).json(secureOutputValues);
}
