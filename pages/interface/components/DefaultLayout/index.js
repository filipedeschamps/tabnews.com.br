import { Box } from '@primer/react';
import { Head, Header } from 'pages/interface/index.js';
import { Footer } from '../Footer';

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
        containerWidth={containerWidth}
        sx={{
          marginX: 'auto',
          padding: [2, null, null, 4],
          paddingTop: [3, null, null, 4],
        }}
      />
    </>
  );
}
