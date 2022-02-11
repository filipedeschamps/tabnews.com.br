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
  .get(authorization.canRequest('user_list:read'), getHandler)
  .post(authorization.canRequest('user:create'), postHandler);

async function getHandler(request, response) {
  const userTryingToList = request.context.user;

  const userList = await user.findAll();

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'user_list:read', userList);

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToCreate, 'user:create', insecureInputValues);

  const newUser = await user.create(secureInputValues);
  await activation.sendActivationEmailToUser(newUser);

  const secureOutputValues = authorization.filterOutput(newUser, 'user:read', newUser);

  return response.status(201).json(secureOutputValues);
}
