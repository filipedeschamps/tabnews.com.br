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

async function handleRequest(req, res) {
  const userTryingToList = user.createAnonymous();

  const results = await content.findAll({
    order: 'published_at DESC',
    where: {
      parent_id: null,
      status: 'published',
    },
  });

  const posts = authorization.filterOutput(userTryingToList, 'read:content:list', results);
  const feed = rss.generateRssFeed(posts, req.url.protocol + '//' + req.url.host + '/');
  res.status(200).send(feed.rss2());
}
