import { Box } from '@primer/react';
import { Footer, Head, Header } from 'pages/interface/index.js';

export default function DefaultLayout({ children, containerWidth = 'large', metadata }) {
  return (
    <>
      {metadata && <Head metadata={metadata} />}
      <Header />
      <Box
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          padding: [2, null, null, 4],
          paddingTop: [3, null, null, 4],
        }}>
        {children}
      </Box>
      <Footer
        maxWidth={containerWidth}
        sx={{
          marginX: 'auto',
          paddingX: [2, null, null, 4],
          paddingTop: 3,
        }}
      />
    </>
  );
}
