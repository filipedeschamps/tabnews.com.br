import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMediaQuery } from 'pages/interface/index.js';

export default function DefaultLayout({ children, metadata }) {
  const { type, title, description, image, url, noIndex, author, published_time, modified_time } = metadata;
  const systemTheme = useMediaQuery('(prefers-color-scheme: dark)');
  const favicon = systemTheme ? '/favicon-dark.png' : '/favicon-light.png';

  const router = useRouter();
  const pathName = router.pathname;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="title" content={title} />
        {description && <meta name="description" content={description} />}
        <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index follow'} />

        {(pathName === '/' || pathName === '/recentes') && (
          <link rel="alternate" type="application/rss+xml" title="TabNews: Recentes" href="/recentes/rss" />
        )}

        <meta property="og:site_name" content="TabNews" />
        <meta property="og:type" content={type} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:image" content={image} />

        {author && <meta property="article:author" content={author} />}
        {published_time && <meta property="article:published_time" content={published_time} />}
        {modified_time && <meta property="article:modified_time" content={modified_time} />}
        {author && <meta property="article:section" content="tecnologia" />}

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={title} />
        {description && <meta property="twitter:description" content={description} />}
        <meta property="twitter:image" content={image} />

        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href={favicon} type="image/png" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>
      {children}
    </>
  );
}
