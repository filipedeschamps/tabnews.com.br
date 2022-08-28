import { Box } from '@primer/react';
import { Link } from 'pages/interface';
import { CgTab } from 'react-icons/cg';

export function Footer({ sx, containerWidth }) {
  return (
    <Box as="footer" sx={sx} maxWidth={containerWidth}>
      <Box
        sx={{
          borderColor: 'border.default',
          borderTopStyle: 'solid',
          borderTopWidth: 1,
          width: '100%',
          paddingTop: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap-reverse',
          gap: 3,
        }}>
        <Box
          fontSize={1}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            color: 'fg.subtle',
          }}>
          <CgTab size={26} />® {new Date().getFullYear()} TabNews.
        </Box>
        <Box
          fontSize={1}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}>
          <Link href="/status">Status</Link>
        </Box>
      </Box>
    </Box>
  );
}
