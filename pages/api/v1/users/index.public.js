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
  .get(getHandler)
  .post(authorization.canRequest('create:user'), postHandler)
  .use(controller.closeDatabaseConnection);

async function getHandler(request, response, next) {
  const userTryingToList = request.context.user;

  const userList = await user.findAll();

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:user:list', userList);

  response.status(200).json(secureOutputValues);
  return next();
}

async function postHandler(request, response, next) {
  const userTryingToCreate = request.context.user;
  const insecureInputValues = request.body;
  const secureInputValues = authorization.filterInput(userTryingToCreate, 'create:user', insecureInputValues);

  const newUser = await user.create(secureInputValues);
  await activation.sendActivationEmailToUser(newUser);

  const secureOutputValues = authorization.filterOutput(newUser, 'read:user', newUser);

  response.status(201).json(secureOutputValues);
  return next();
}
