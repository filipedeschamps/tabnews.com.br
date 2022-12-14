import fetch from 'cross-fetch';
import orchestrator from 'tests/orchestrator.js';

describe('GET /recentes/rss', () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  describe('Anonymous user', () => {
    test('With `/rss` alias`', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/rss`);
      expect(response.status).toEqual(200);
    });

    test('With `/rss.xml` alias`', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/rss.xml`);
      expect(response.status).toEqual(200);
    });

    test('With 0 contents', async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/recentes/rss`);
      const responseBody = await response.text();

      const lastBuildDateFromResponseBody = /<lastBuildDate>(.*?)<\/lastBuildDate>/.exec(responseBody, 'g')[1];

      expect(response.status).toEqual(200);

      expect(responseBody).toStrictEqual(`<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
    <channel>
        <title>TabNews</title>
        <link>http://localhost:3000/recentes/rss</link>
        <description>Conteúdos para quem trabalha com Programação e Tecnologia</description>
        <lastBuildDate>${lastBuildDateFromResponseBody}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <generator>https://github.com/jpmonette/feed</generator>
        <language>pt</language>
        <image>
            <title>TabNews</title>
            <url>http://localhost:3000/favicon-mobile.png</url>
            <link>http://localhost:3000/recentes/rss</link>
        </image>
    </channel>
</rss>`);
    });

    test('With 3 contents, 2 `published` and 1 with `draft` status', async () => {
      const defaultUser = await orchestrator.createUser();

      const firstRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo #1 (mais antigo)',
        status: 'published',
        body: `# Corpo com HTML

É **importante** lidar corretamente com o \`HTML\`, incluindo estilos ~~especiais~~ do \`GFM\`.`,
      });

      const secondRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo #2 (mais novo)',
        body: 'Este é um corpo bastante longo, vamos ver como que a propriedade description irá reagir, pois por padrão ela deverá cortar após um número X de caracteres. Não vou tomar nota aqui da quantidade exata de caracteres, pois isso pode mudar ao longo do tempo.',
        status: 'published',
      });

      const thirdRootContent = await orchestrator.createContent({
        owner_id: defaultUser.id,
        title: 'Conteúdo #3 (mais novo, mas no status "draft")',
        body: `Este conteúdo não deverá aparecer na lista retornada pelo rss,
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
        <link>http://localhost:3000/recentes/rss</link>
        <description>Conteúdos para quem trabalha com Programação e Tecnologia</description>
        <lastBuildDate>${new Date(secondRootContent.published_at).toUTCString()}</lastBuildDate>
        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
        <generator>https://github.com/jpmonette/feed</generator>
        <language>pt</language>
        <image>
            <title>TabNews</title>
            <url>http://localhost:3000/favicon-mobile.png</url>
            <link>http://localhost:3000/recentes/rss</link>
        </image>
        <item>
            <title><![CDATA[Conteúdo #2 (mais novo)]]></title>
            <link>http://localhost:3000/${secondRootContent.owner_username}/${secondRootContent.slug}</link>
            <guid>http://localhost:3000/${secondRootContent.owner_username}/${secondRootContent.slug}</guid>
            <pubDate>${new Date(secondRootContent.published_at).toUTCString()}</pubDate>
            <description><![CDATA[Este é um corpo bastante longo, vamos ver como que a propriedade description irá reagir, pois por padrão ela deverá cortar após um número X de caracteres. Não vou tomar nota aqui da quant...]]></description>
            <content:encoded><![CDATA[<div class="markdown-body"><p>Este é um corpo bastante longo, vamos ver como que a propriedade description irá reagir, pois por padrão ela deverá cortar após um número X de caracteres. Não vou tomar nota aqui da quantidade exata de caracteres, pois isso pode mudar ao longo do tempo.</p></div>]]></content:encoded>
        </item>
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
