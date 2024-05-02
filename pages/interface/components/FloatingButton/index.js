import { Box } from '@primer/react';

export default function FloatingButton({ children }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
      }}>
      {children}
    </Box>
  );
}
