import { Box, PrimerTooltip } from '@/TabNewsUI';

export default function Tooltip({ children, ...props }) {
  const { sx: { position, ...sxRest } = {} } = props;

  if (position === 'absolute')
    return (
      <Box sx={{ display: 'inline-flex' }}>
        <Box sx={{ ...sxRest, visibility: 'hidden' }}>{children}</Box>
        <PrimerTooltip {...props}>{children}</PrimerTooltip>
      </Box>
    );

  return <PrimerTooltip {...props}>{children}</PrimerTooltip>;
}
