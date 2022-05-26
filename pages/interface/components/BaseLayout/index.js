import Head from 'next/head';

export default function DefaultLayout({ children, metadata }) {
  const { title, description, image, url, noIndex } = metadata;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="title" content={title} />
        {description && <meta name="description" content={description} />}
        <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index follow'} />

        <meta property="og:site_name" content="TabNews" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:image" content={image} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={title} />
        {description && <meta property="twitter:description" content={description} />}
        <meta property="twitter:image" content={image} />

        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png"></link>
      </Head>
      {children}
    </>
  );
}
