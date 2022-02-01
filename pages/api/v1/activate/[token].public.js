import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import activate from 'models/activation.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestId)
  .get(getHandler);

async function getHandler(request, response) {
  const tokenId = request.query.token;
  const activatedUser = await activate.activateUserUsingTokenId(tokenId);
  const authorizedValuesToReturn = await extractAuthorizedValuesToReturn(activatedUser);

  return response.status(200).json(authorizedValuesToReturn);

  async function extractAuthorizedValuesToReturn(user) {
    const publicValues = {
      id: user.id,
      username: user.username,
      features: user.features,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return publicValues;
  }
}
