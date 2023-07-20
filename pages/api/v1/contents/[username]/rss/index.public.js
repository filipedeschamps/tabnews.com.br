import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import validator from 'models/validator.js';
import content from 'models/content.js';
import user from 'models/user.js';
import rss from 'models/rss.js';
import webserver from 'infra/webserver.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(cacheControl.swrMaxAge(10))
  .get(getValidationHandler, getHandler);

function getValidationHandler(request, response, next) {
  const cleanValues = validator(request.query, {
    username: 'required',
    page: 'optional',
    per_page: 'optional',
    strategy: 'optional',
  });

  request.query = cleanValues;

  next();
}

async function getHandler(request, response) {
  const userTryingToGet = user.createAnonymous();

  const results = await content.findWithStrategy({
    strategy: request.query.strategy,
    where: {
      owner_username: request.query.username,
      status: 'published',
    },
    page: request.query.page,
    per_page: request.query.per_page,
  });

  const contentListFound = results.rows;

  const secureOutputValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);
  const rss2 = rss.generateRss2(secureOutputValues, `${webserver.host}/${request.query.username}/rss`);

  response.setHeader('Content-Type', 'text/xml; charset=utf-8');
  return response.status(200).send(rss2);
}
