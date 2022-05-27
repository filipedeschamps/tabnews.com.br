import { Box, useTheme } from '@primer/react';
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

  return (
    <BaseLayout metadata={metadata} content={content}>
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
