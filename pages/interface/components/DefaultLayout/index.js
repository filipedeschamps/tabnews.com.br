import { GoToTopButton } from '@tabnews/ui';

import { Box, Footer, Header } from '@/TabNewsUI';
import { Head } from 'pages/interface';

export default function DefaultLayout({ children, containerWidth = 'large', metadata }) {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'canvas.default' }}>
      {metadata && <Head metadata={metadata} />}
      <Header />
      <Box
        as="main"
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
      <GoToTopButton target="header" />
    </Box>
  );
}
