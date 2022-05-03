import { Box } from '@primer/react';
import { BaseLayout, Header } from 'pages/interface/index.js';

export default function DefaultLayout({ children, containerWidth = 'large', metadata, content }) {
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
