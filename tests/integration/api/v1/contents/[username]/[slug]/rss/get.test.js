import fetch from 'cross-fetch';
import orchestrator from 'tests/orchestrator.js';

describe('GET /recentes/rss', () => {
  beforeEach(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  describe('Anonymous user', () => {
    test('With no content', async () => {
      const defaultUser = await orchestrator.createUser();

      const response = await fetch(`${orchestrator.webserverUrl}/${defaultUser.username}/inexists/rss`);

      expect(response.status).toEqual(500);
    });

    test('With content passed', async () => {
      const defaultUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo #1 (mais antigo)',
        status: 'published',
        body: `# Corpo com HTML
  
  É **importante** lidar corretamente com o \`HTML\`, incluindo estilos ~~especiais~~ do \`GFM\`.`,
      });

      const response = await fetch(`${orchestrator.webserverUrl}/${defaultUser.username}/${firstRootContent.slug}/rss`);
      const responseBody = await response.text();

      expect(response.status).toEqual(200);
      expect(responseBody).toStrictEqual(`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
        <title>TabNews</title>
        <link>http://localhost:3000/${defaultUser.username}/${firstRootContent.slug}/rss</link>
        <description>Conteúdos para quem trabalha com Programação e Tecnologia</description>
        <lastBuildDate>${new Date(firstRootContent.published_at).toUTCString()}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <generator>https://github.com/jpmonette/feed</generator>
        <language>pt</language>
        <image>
            <title>TabNews</title>
            <url>http://localhost:3000/favicon-mobile.png</url>
            <link>http://localhost:3000/${defaultUser.username}/${firstRootContent.slug}/rss</link>
        </image>
        <item>
            <title><![CDATA[Conteúdo #1 (mais antigo)]]></title>
            <link>http://localhost:3000/${firstRootContent.owner_username}/${firstRootContent.slug}</link>
            <guid>http://localhost:3000/${firstRootContent.owner_username}/${firstRootContent.slug}</guid>
            <pubDate>${new Date(firstRootContent.published_at).toUTCString()}</pubDate>
            <description><![CDATA[Corpo com HTML É importante lidar corretamente com o HTML, incluindo estilos especiais do GFM.]]></description>
            <content:encoded><![CDATA[<div class="markdown-body"><h1>Corpo com HTML</h1><p>É <strong>importante</strong> lidar corretamente com o <code>HTML</code>, incluindo estilos <del>especiais</del> do <code>GFM</code>.</p></div>]]></content:encoded>
        </item>
    </channel>
</rss>`);
    });
  });
});
