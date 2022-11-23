import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import user from 'models/user';
import { renderToStaticMarkup } from 'react-dom/server';

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
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(renderToStaticMarkup(<img src={(await user.enable_2fa(authenticatedUser)).qrcode} />));
}
async function deleteHandler(req, res) {
  const authenticatedUser = req.context.user;
  await user.disable_2fa(authenticatedUser);
  return res.status(200).json({ message: `2FA desativado com sucesso!` });
}
