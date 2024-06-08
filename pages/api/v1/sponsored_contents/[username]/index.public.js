import nextConnect from 'next-connect';

import authorization from 'models/authorization';
import cacheControl from 'models/cache-control';
import controller from 'models/controller';
import sponsoredContent from 'models/sponsored-content';
import user from 'models/user';
import validator from 'models/validator';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    page: 'optional',
    per_page: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const results = await sponsoredContent.findAllByOwnerUsername({
    owner_username: request.query.username,
    page: request.query.page,
    per_page: request.query.per_page,
  });
  const sponsoredContentListFound = results.rows;

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    'read:sponsored_content:list',
    sponsoredContentListFound,
  );

  controller.injectPaginationHeaders(
    results.pagination,
    `/api/v1/sponsored_contents/${request.query.username}`,
    response,
  );

  return response.status(200).json(secureOutputValues);
}
