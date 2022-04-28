import Head from 'next/head';

export default function DefaultLayout({ children, metadata = {}, content }) {
  let title = 'TabNews';
  let url;

  if (content) {
    if (content.title) {
      title = `${content.title} · ${content.username} · TabNews`;
    } else {
      title = `${content.username}/${content.slug} · TabNews`;
    }
    url = `https://tabnews.com/${content.username}/${content.slug}`;
  }

  if (metadata.title) {
    title = `${metadata.title} · TabNews`;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} key="title" />
        {url && (
          <>
            <meta property="og:url" content={url} key="url" />
            <link rel="canonical" href={url} />
          </>
        )}
        <meta property="og:site_name" content="TabNews" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png"></link>
      </Head>
      {children}
    </>
  );
}
