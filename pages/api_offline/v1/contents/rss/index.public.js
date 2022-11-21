import nextConnect from 'next-connect';
import controller from 'models/controller.js';
import authorization from 'models/authorization.js';
import user from 'models/user.js';
import rss from 'models/rss';
import content from 'models/content.js';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(handleRequest);

async function handleRequest(request, response) {
  const userTryingToList = user.createAnonymous();

  const results = await content.findWithStrategy({
    strategy: 'new',
    where: {
      parent_id: null,
      status: 'published',
    },
    page: 1,
    per_page: 30,
  });

  const contentListFound = results.rows;

  const secureContentListFound = authorization.filterOutput(userTryingToList, 'read:content:list', contentListFound);
  const rss2 = rss.generateRss2(secureContentListFound);

  response.setHeader('Content-Type', 'text/xml; charset=utf-8');
  response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate');
  response.status(200).send(rss2);
}
