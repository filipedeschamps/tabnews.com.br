/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: 'https://tabnews.com.br',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 7000,
  robotsTxtOptions: {
    additionalPaths: [`https://tabnews.com.br/sitemap.xml`],
  },
};

module.exports = config;
