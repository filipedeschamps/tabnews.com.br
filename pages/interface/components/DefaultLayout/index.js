import { Box } from '@primer/react';
import { MetaTags, Header } from 'pages/interface/index.js';

export default function DefaultLayout({ children, containerWidth = 'large', metadata }) {
  return (
    <>
      <MetaTags metadata={metadata} />
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
    </>
  );
}
