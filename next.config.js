module.exports = {
  pageExtensions: ['public.js'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    nftTracing: true,
  },
  compiler: {
    styledComponents: true,
  },
  i18n: {
    locales: ['pt-br'],
    defaultLocale: 'pt-br',
  },
  async redirects() {
    return [
      {
        source: '/rss',
        destination: '/recentes/rss',
        permanent: true,
      },
      {
        source: '/rss.xml',
        destination: '/recentes/rss',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/recentes/rss',
        destination: '/api/v1/contents/rss',
      },
    ];
  },
};
