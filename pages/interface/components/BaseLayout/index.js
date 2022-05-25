import Head from 'next/head';
import { useRouter } from 'next/router';

// TODO: remove `content` from the props and only work with `metadata`
export default function DefaultLayout({ children, metadata = {} }) {
  const router = useRouter();
  const defaultMetadata = {
    title: 'TabNews',
    description: 'Conteúdos com valor concreto para quem trabalha com tecnologia.',
    image: 'default-image-share.png',
    noIndex: false,
  };

  const { title, description, image, noIndex } = { ...defaultMetadata, ...metadata };
  const siteUrl = 'https://tabnews.com.br/';
  const url = `${siteUrl}${router.asPath}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index follow'} />

        <meta property="og:site_name" content="TabNews" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image.startsWith('https://') ? image : `${siteUrl}${image}`} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={image.startsWith('https://') ? image : `${siteUrl}${image}`} />

        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png"></link>
      </Head>
      {children}
    </>
  );
}
