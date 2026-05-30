import { Box, TooltipV1 } from '@/TabNewsUI';

const gap = '2px';

const replaceMargin = {
  '&.tooltipped-s, &.tooltipped-se, &.tooltipped-sw': {
    '&::after': {
      marginTop: gap,
    },
  },
  '&.tooltipped-e, &.tooltipped-se, &.tooltipped-ne': {
    '&::after': {
      marginLeft: gap,
    },
  },
  '&.tooltipped-n, &.tooltipped-ne, &.tooltipped-nw': {
    '&::after': {
      marginBottom: gap,
    },
  },
  '&.tooltipped-w, &.tooltipped-sw, &.tooltipped-nw': {
    '&::after': {
      marginRight: gap,
    },
  },
};

export default function Tooltip({ children, sx, ...props }) {
  const { position, ...sxRest } = sx || {};

  if (position === 'absolute')
    return (
      <Box sx={{ display: 'inline-flex' }}>
        <Box sx={{ ...sxRest, visibility: 'hidden' }}>{children}</Box>
        <TooltipV1 sx={{ ...replaceMargin, ...sx }} {...props}>
          {children}
        </TooltipV1>
      </Box>
    );

  return (
    <TooltipV1 sx={{ ...replaceMargin, ...sx }} {...props}>
      {children}
    </TooltipV1>
  );
}
