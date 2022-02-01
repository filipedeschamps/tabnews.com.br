import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import user from 'models/user.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .get(getHandler)
  .patch(patchHandler);

async function getHandler(request, response) {
  const userObject = await user.findOneByUsername(request.query.username);

  const responseBody = {
    id: userObject.id,
    username: userObject.username,
    email: userObject.email,
    created_at: userObject.created_at,
    updated_at: userObject.updated_at,
  };

  return response.status(200).json(responseBody);
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
