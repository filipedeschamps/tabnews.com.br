import { Box, Flash } from '@primer/react';
import { Footer, Head, Header } from 'pages/interface/index.js';

export default function DefaultLayout({ children, containerWidth = 'large', metadata }) {
  return (
    <>
      {metadata && <Head metadata={metadata} />}
      <Header
        sx={{
          height: '64px',
        }}
      />
      <Box
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          padding: [2, null, null, 4],
          paddingTop: [3, null, null, 4],
          minHeight: 'calc(100vh - 64px - 113px)',
        }}>
        {children}
      </Box>
      <Footer
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          paddingX: [2, null, null, 4],
          paddingTop: 3,
          height: '113px',
        }}
      />
    </>
  );
}
