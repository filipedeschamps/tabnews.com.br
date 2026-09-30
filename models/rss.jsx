import { Feed } from 'feed';
import { renderToStaticMarkup } from 'react-dom/server';

import { Viewer } from '@/TabNewsUI';
import webserver from 'infra/webserver.js';
import removeMarkdown from 'models/remove-markdown';

// Characters not allowed in XML 1.0 (C0 controls except \t \n \r, lone surrogates, U+FFFE and U+FFFF)
// would make the whole feed unreadable, even inside a CDATA section.
const INVALID_XML_CHARS = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;

// `xml-js` (used by `feed`) only escapes the first "]]>" inside a CDATA section,
// so any further occurrence would close it and inject arbitrary XML into the feed.
function escapeCdata(text) {
  return text.replace(INVALID_XML_CHARS, '').replaceAll(']]>', ']]\u200B>');
}

function generateRss2(contentList) {
  const webserverHost = webserver.host;

  // TODO: make this property flexible in the future to
  // support things like: `/[username]/rss`
  const feedURL = `${webserverHost}/recentes/rss`;

  const feed = new Feed({
    title: 'TabNews',
    description: 'Conteúdos para quem trabalha com Programação e Tecnologia',
    id: feedURL,
    link: feedURL,
    image: `${webserverHost}/favicon-mobile.png`,
    favicon: `${webserverHost}/favicon-mobile.png`,
    language: 'pt',
    updated: contentList.length > 0 ? new Date(contentList[0].updated_at) : new Date(),
    feedLinks: {
      rss2: feedURL,
    },
  });

  contentList.forEach((contentObject) => {
    const contentUrl = `${webserverHost}/${contentObject.owner_username}/${contentObject.slug}`;

    feed.addItem({
      title: escapeCdata(contentObject.title),
      id: contentUrl,
      link: contentUrl,
      description: escapeCdata(removeMarkdown(contentObject.body, { maxLength: 190 })),
      content: escapeCdata(
        renderToStaticMarkup(
          <Viewer
            value={contentObject.body}
            clobberPrefix={`${contentObject.owner_username}-content-`}
            shouldRenderMath={false}
          />,
        ).replace(/[\r\n]/gm, ''),
      ),
      author: [
        {
          name: contentObject.owner_username,
          link: `${webserverHost}/${contentObject.owner_username}`,
        },
      ],
      date: new Date(contentObject.published_at),
    });
  });

  return feed.rss2();
}

export default Object.freeze({
  generateRss2,
});
