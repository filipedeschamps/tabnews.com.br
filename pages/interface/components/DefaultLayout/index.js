import { Box, useTheme } from '@primer/react';
import { useRouter } from 'next/router';
import webserver from 'infra/webserver.js';
import { BaseLayout, Header } from 'pages/interface/index.js';
import { useEffect } from 'react';

export default function DefaultLayout({ children, containerWidth = 'large', metadata, content }) {
  const { setColorMode, colorMode } = useTheme();

  useEffect(() => {
    (async () => {
      const darkMode = window
        .matchMedia("(prefers-color-scheme: dark)")
        .matches;

      const systemTheme = !darkMode ? 'day' : 'night';
      const mode = await localStorage.getItem('theme') || systemTheme;

      setColorMode(mode);
    })();
  }, [setColorMode]);

  useEffect(() => {
    document
      .querySelector('html')
      .setAttribute('data-theme', colorMode);

    localStorage.setItem('theme', colorMode);
  }, [colorMode]);

  const router = useRouter();
  const webserverHost = webserver.getHost();
  const defaultMetadata = {
    title: 'TabNews',
    description: null,
    image: `${webserverHost}/default-image-share.png`,
    url: `${webserverHost}${router.asPath}`,
    noIndex: false,
  };

  let updatedMetadata = { ...defaultMetadata, ...metadata };

  if (content) {
    if (content.title) {
      updatedMetadata.title = `${content.title} · ${content.username}`;
    } else {
      updatedMetadata.title = `${content.username}/${content.slug}`;
    }
  }

  if (updatedMetadata.title && updatedMetadata.title != defaultMetadata.title) {
    updatedMetadata.title = `${updatedMetadata.title} · TabNews`;
  }

  return (
    <BaseLayout metadata={updatedMetadata}>
      <Header />
      <Box
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          padding: [3, null, null, 4],
        }}>
        {children}
      </Box>
    </BaseLayout>
  );
}
