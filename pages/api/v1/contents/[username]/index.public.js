import { createRouter } from 'next-connect';

import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import content from 'models/content.js';
import controller from 'models/controller.js';
import removeMarkdown from 'models/remove-markdown.js';
import user from 'models/user.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(10))
  .get(getValidationHandler, getHandler)
  .handler(controller.handlerOptions);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    page: 'optional',
    per_page: 'optional',
    strategy: 'optional',
    with_root: 'optional',
    with_children: 'optional',
  });

  request.query = cleanValues;

  return next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const results = await content.findWithStrategy({
    strategy: request.query.strategy,
    where: {
      parent_id: request.query.with_children === false ? null : undefined,
      owner_username: request.query.username,
      status: 'published',
      $not_null: request.query.with_root === false ? ['parent_id'] : undefined,
    },
    page: request.query.page,
    per_page: request.query.per_page,
  });
  const contentListFound = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  for (const content of secureOutputValues) {
    if (content.parent_id) {
      content.body = removeMarkdown(content.body, { maxLength: 255 });
    } else {
      delete content.body;
    }
  }

  controller.injectPaginationHeaders(
    results.pagination,
    `/api/v1/contents/${request.query.username}`,
    request,
    response,
  );

  return response.status(200).json(secureOutputValues);
}
