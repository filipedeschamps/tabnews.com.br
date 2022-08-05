import rss from 'models/rss';
import fetch from 'cross-fetch';
import orchestrator from 'tests/orchestrator.js';

describe('Generate RSS Feed', () => {
  it('should convert the posts into RSS format', () => {
    const date = new Date();

    const feed = rss.generateRssFeed([
      {
        username: 'coffee-is-power',
        body: 'Some cool stuff',
        id: '00000000-0000-0000-0000-000000000000',
        published_at: date.toISOString(),
      },
    ]);
    // TODO: this fixes false-negatives, but it's also kinda bad
    feed.options.updated = date;
    const expectedXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
        <title>TabNews</title>
        <link>http://localhost:3000</link>
        <description>Conteudos para quem trabalha com tecnologia</description>
        <lastBuildDate>${date.toUTCString()}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <generator>npm 'feed' package</generator>
        <image>
            <title>TabNews</title>
            <url>http://localhost:3000/default-image-share.png</url>
            <link>http://localhost:3000</link>
        </image>
        <copyright>This software is completely free and open-source on the GPL 3.0 license</copyright>
        <item>
            <link>http://localhost:3000/coffee-is-power/undefined</link>
            <guid>00000000-0000-0000-0000-000000000000</guid>
            <pubDate>${date.toUTCString()}</pubDate>
            <description><![CDATA[Some cool ...]]></description>
            <content:encoded><![CDATA[<p>Some cool stuff</p>]]></content:encoded>
        </item>
    </channel>
</rss>`;
    expect(feed.rss2()).toBe(expectedXml);
  });
});

describe('GET /rss', () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });
  beforeEach(async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  describe('Anonymous user', () => {
    it('should return an rss with no items if no posts were added', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/rss`);
      const date = new Date().toUTCString();
      const responseBody = await response.text();
      expect(response.status).toEqual(200);
      expect(responseBody).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>TabNews</title>
        <link>http://localhost:3000</link>
        <description>Conteudos para quem trabalha com tecnologia</description>
        <lastBuildDate>${date}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <generator>npm 'feed' package</generator>
        <image>
            <title>TabNews</title>
            <url>http://localhost:3000/default-image-share.png</url>
            <link>http://localhost:3000</link>
        </image>
        <copyright>This software is completely free and open-source on the GPL 3.0 license</copyright>
    </channel>
</rss>`);
    });
    it('should return all the posts on the RSS format', async () => {
      const defaultUser = await orchestrator.createUser();
      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Primeiro conteúdo criado',
        status: 'published',
        body: '# Some text',
      });
      const secondRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Segundo conteúdo criado',
        body: 'Some stuff',
        status: 'published',
      });

      const thirdRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Terceiro conteúdo criado',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo /contents,
               porque quando um conteúdo possui o "status" como "draft", ele não
               esta pronto para ser listado publicamente.`,
        status: 'draft',
      });

      const response = await fetch(`${orchestrator.webserverUrl}/rss`);
      const responseBody = await response.text();

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual(`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
        <title>TabNews</title>
        <link>http://localhost:3000</link>
        <description>Conteudos para quem trabalha com tecnologia</description>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <generator>npm 'feed' package</generator>
        <image>
            <title>TabNews</title>
            <url>http://localhost:3000/default-image-share.png</url>
            <link>http://localhost:3000</link>
        </image>
        <copyright>This software is completely free and open-source on the GPL 3.0 license</copyright>
        <item>
            <title><![CDATA[Segundo conteúdo criado]]></title>
            <link>http://localhost:3000/${secondRootContent.username}/segundo-conteudo-criado</link>
            <guid>${secondRootContent.id}</guid>
            <pubDate>${new Date(secondRootContent.published_at).toUTCString()}</pubDate>
            <description><![CDATA[Some stuff...]]></description>
            <content:encoded><![CDATA[<p>Some stuff</p>]]></content:encoded>
        </item>
        <item>
            <title><![CDATA[Primeiro conteúdo criado]]></title>
            <link>http://localhost:3000/${firstRootContent.username}/primeiro-conteudo-criado</link>
            <guid>${firstRootContent.id}</guid>
            <pubDate>${new Date(firstRootContent.published_at).toUTCString()}</pubDate>
            <description><![CDATA[# Some tex...]]></description>
            <content:encoded><![CDATA[<h1 id="sometext">Some text</h1>]]></content:encoded>
        </item>
    </channel>
</rss>`);
    });
  });
});
