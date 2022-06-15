module.exports = {
  pageExtensions: ['public.js'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: { nftTracing: true },
  compiler: {
    styledComponents: true,
  },
  i18n: {
    locales: ['pt-br'],
    defaultLocale: 'pt-br',
  },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/image.png',
        destination: '/api/og-image',
      },
    ];
  },
};
