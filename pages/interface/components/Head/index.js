import webserver from 'infra/webserver.js';
import NextHead from 'next/head';
import { useRouter } from 'next/router';
import { useMediaQuery } from 'pages/interface/index.js';

const webserverHost = webserver.getHost();

export function DefaultHead() {
  const router = useRouter();
  const pathName = router.pathname;

  const systemTheme = useMediaQuery('(prefers-color-scheme: dark)');
  const favicon = systemTheme ? '/favicon-dark.png' : '/favicon-light.png';

  const defaultMetadata = {
    title: 'TabNews: Conteúdos para quem trabalha com Programação e Tecnologia',
    image: `${webserverHost}/default-image-share.png`,
    description: 'Conteúdos com valor concreto para quem trabalha com tecnologia.',
    url: `${webserverHost}${router.asPath}`,
    type: 'website',
    noIndex: false,
  };

  const { type, title, description, image, url, noIndex } = defaultMetadata;

  return (
    <NextHead>
      <title>{title}</title>
      <meta name="title" content={title} key="title" />
      <meta name="description" content={description} key="description" />
      <meta name="robots" content="index follow" key="robots" />

      {(pathName === '/' || pathName === '/recentes') && (
        <link rel="alternate" type="application/rss+xml" title="TabNews: Recentes" href="/recentes/rss" />
      )}

      <meta property="og:site_name" content="TabNews" />
      <meta property="og:type" content={type} key="og:type" />
      <meta property="og:url" content={url} key="og:url" />
      <meta property="og:title" content={title} key="og:title" />
      <meta property="og:description" content={description} key="og:description" />
      <meta property="og:image" content={image} key="og:image" />

      <meta property="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta property="twitter:url" content={url} key="twitter:url" />
      <meta property="twitter:title" content={title} key="twitter:title" />
      <meta property="twitter:description" content={description} key="twitter:description" />
      <meta property="twitter:image" content={image} key="twitter:image" />

      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href={favicon} type="image/png" />
      <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
    </NextHead>
  );
}

export default function Head({ metadata, children }) {
  const { type, title, description, image, url, noIndex, author, published_time, modified_time } = metadata || {};

  return (
    <NextHead>
      {title && (
        <>
          <title>{`${title} · TabNews`}</title>
          <meta name="title" content={title} key="title" />
          <meta property="og:title" content={title} key="og:title" />
          <meta property="twitter:title" content={title} key="twitter:title" />
        </>
      )}

      {description && (
        <>
          <meta name="description" content={description} key="description" />
          <meta property="og:description" content={description} key="og:description" />
          <meta property="twitter:description" content={description} key="twitter:description" />
        </>
      )}

      {url && (
        <>
          <meta property="og:url" content={url} key="og:url" />
          <meta property="twitter:url" content={url} key="twitter:url" />
        </>
      )}

      {image && (
        <>
          <meta property="og:image" content={image} key="og:image" />
          <meta property="twitter:image" content={image} key="twitter:image" />
        </>
      )}

      {author && (
        <>
          <meta property="article:author" content={author} />
          <meta property="article:section" content="tecnologia" />
        </>
      )}

      {noIndex && <meta name="robots" content="noindex, nofollow" key="robots" />}

      {type && <meta property="og:type" content={type} key="og:type" />}

      {published_time && <meta property="article:published_time" content={published_time} />}

      {modified_time && <meta property="article:modified_time" content={modified_time} />}

      {children}
    </NextHead>
  );
}
