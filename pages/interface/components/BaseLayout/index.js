import Head from 'next/head';

// TODO: remove `content` from the props and only work with `metadata`
export default function DefaultLayout({ children, metadata = {}, content }) {
  let title = 'TabNews';

  if (content) {
    if (content.title) {
      title = `${content.title} · ${content.username} · TabNews`;
    } else {
      title = `${content.username}/${content.slug} · TabNews`;
    }
  }

  if (metadata.title) {
    title = `${metadata.title} · TabNews`;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} key="title" />
        <meta property="og:site_name" content="TabNews" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png"></link>
      </Head>
      {children}
    </>
  );
}
