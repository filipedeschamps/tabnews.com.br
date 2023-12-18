import { Box, Text, Tooltip } from '@/TabNewsUI';
import { SquareFillIcon } from '@/TabNewsUI/icons';

export default function TabCashCount({ amount, direction, sx }) {
  return (
    <Tooltip aria-label="TabCash" direction={direction ?? 's'} noDelay={true} wrap={true}>
      <Box sx={{ display: 'flex', textWrap: 'nowrap', alignItems: 'center', ...sx }}>
        <SquareFillIcon fill="#2da44e" size={16} />
        <Text>{amount?.toLocaleString('pt-BR')}</Text>
      </Box>
    </Tooltip>
  );
}
