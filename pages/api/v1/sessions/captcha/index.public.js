import nextConnect from 'next-connect';

import cacheControl from 'models/cache-control';
import captcha from 'models/captcha';
import controller from 'models/controller.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .post(postHandler);

async function postHandler(request, response) {
  const captchaData = await captcha.create();
  const captchaPng = await captcha.asPng(captchaData.token);

  return response.status(200).json({
    id: captchaData.id,
    image: `data:image/png;base64,${captchaPng.toString('base64')}`,
  });
}
