import nextConnect from 'next-connect';

import authorization from 'models/authorization';
import cacheControl from 'models/cache-control';
import controller from 'models/controller';
import removeMarkdown from 'models/remove-markdown';
import search from 'models/search';
import user from 'models/user';
import validator from 'models/validator';

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
    q: 'required',
    strategy: 'optional',
    page: 'optional',
    per_page: 'optional',
    only_children: 'optional',
    with_children: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToList = user.createAnonymous();

  const results = await search.findAll({
    q: request.query.q,
    strategy: request.query.strategy,
    page: request.query.page,
    per_page: request.query.per_page,
    only_children: request.query.only_children ? true : null,
    with_children: request.query.with_children ? true : null,
  });

  const contentList = results.rows;

  if (!contentList.length > 0) {
    return response.status(200).json({ contents: [] });
  }

  const secureOutputValues = authorization.filterOutput(userTryingToList, 'read:content:list', contentList);

  if (request.query.with_children || request.query.only_children) {
    for (const content of secureOutputValues) {
      if (content.parent_id) {
        content.body = removeMarkdown(content.body, { maxLength: 255 });
      } else {
        delete content.body;
      }
    }
  }

  controller.injectPaginationHeaders(results.pagination, `/api/v1/search`, response, request.query.q);

  return response.status(200).json({ contents: secureOutputValues });
}
