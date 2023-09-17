import nextConnect from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import controller from 'models/controller.js';
import user from 'models/user';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .post(authorization.canRequest('auth:2fa:enable'), postHandler)
  .delete(authorization.canRequest('auth:2fa:disable'), deleteHandler);

async function postHandler(req, res) {
  const authenticatedUser = req.context.user;
  return res.status(200).json(await user.enable_2fa(authenticatedUser));
}
async function deleteHandler(req, res) {
  const authenticatedUser = req.context.user;
  await user.disable_2fa(authenticatedUser);
  return res.status(200).json({ message: `2FA desativado com sucesso!` });
}
