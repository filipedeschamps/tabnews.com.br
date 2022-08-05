var showdown = require('showdown');
var converter = new showdown.Converter();
// See: https://dev.to/j471n/how-to-add-rss-feed-in-nextjs-blog-34j1
import { Feed } from 'feed';
import webserver from 'infra/webserver.js';
function generateRssFeed(posts) {
  const tabnewsUrl = webserver.getHost();
  const feed = new Feed({
    title: 'TabNews',
    description: 'Conteudos para quem trabalha com tecnologia',
    id: tabnewsUrl,
    link: tabnewsUrl,
    image: `${tabnewsUrl}/default-image-share.png`,
    favicon: `${tabnewsUrl}/favicon.ico`,
    copyright: `This software is completely free and open-source on the GPL 3.0 license`,
    generator: "npm 'feed' package",
    feedLinks: {
      rss2: `${tabnewsUrl}/rss/xml`,
      json: `${tabnewsUrl}/rss/json`,
    },
  });
  posts.forEach((post) => {
    const postUrl = `${tabnewsUrl}/${post.username}/${post.slug}`;
    feed.addItem({
      title: post.title,
      id: post.id,
      link: postUrl,
      description: post.body.substring(0, 10) + '...',
      content: converter.makeHtml(post.body),
      author: [
        {
          name: post.username,
          link: `${tabnewsUrl}/${post.username}`,
        },
      ],
      date: new Date(post.published_at),
    });
  });
  return feed;
}
export default { generateRssFeed };
