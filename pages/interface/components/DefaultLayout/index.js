import { Box, useTheme } from '@primer/react';
import { BaseLayout, Header } from 'pages/interface/index.js';
import { useEffect } from 'react';

export default function DefaultLayout({ children, containerWidth = 'large', metadata, content }) {
  const { setColorMode } = useTheme();

  useEffect(() => {
    (async () => {
      const mode = await localStorage.getItem('theme') || 'day';
      setColorMode(mode);
    })();
  }, []);

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
