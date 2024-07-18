import nextConnect from 'next-connect';

import ad from 'models/advertisement';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(cacheControl.swrMaxAge(10), getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    per_page: 'optional',
    owner_id: 'optional',
    ignore_id: 'optional',
    flexible: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = user.createAnonymous();

  const ads = await ad.getRandom(request.query.per_page, {
    ignoreId: request.query.ignore_id,
    ownerId: request.query.owner_id,
    tryOtherOwners: request.query.flexible,
  });

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:ad:list', ads);

  return response.status(200).json(secureOutputValues);
}
