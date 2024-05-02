import { useEffect, useRef, useState } from 'react';

import { Box, DialogTopics, FloatingButton, Footer, GoToTopButton, Header, OpenDialogTopicsButton } from '@/TabNewsUI';
import { Head } from 'pages/interface';

export default function DefaultLayout({ children, containerWidth = 'large', metadata }) {
  const [isOpenDialogTopics, setOpenDialogTopics] = useState(false);
  const returnFocusRefDialogTopics = useRef(null);

  // set overflow on body to 'hidden' when dialog is open
  useEffect(() => {
    document.body.style.overflow = isOpenDialogTopics ? 'hidden' : 'auto';
  }, [isOpenDialogTopics]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'canvas.default' }}>
      <DialogTopics
        isOpen={isOpenDialogTopics}
        setIsOpen={setOpenDialogTopics}
        returnFocusRef={returnFocusRefDialogTopics}
      />
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
      <FloatingButton>
        <OpenDialogTopicsButton setIsOpen={setOpenDialogTopics} />
        <GoToTopButton />
      </FloatingButton>
    </Box>
  );
}
