import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .get(authentication.injectAnonymousOrUser, authorization.canRequest('read:user'), getHandler)
  .patch(patchHandler);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const userStoredFromDatabase = await user.findOneByUsername(request.query.username);

  const authorizedValuesToReturn = authorization.filterOutput(userTryingToGet, 'read:user', userStoredFromDatabase);

  return response.status(200).json(authorizedValuesToReturn);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const postedUserData = request.body;

  const updatedUser = await user.update(username, postedUserData);

  const responseBody = {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at,
  };

  return response.status(200).json(responseBody);
}
