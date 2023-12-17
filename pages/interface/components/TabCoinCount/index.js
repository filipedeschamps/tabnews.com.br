import { Box, Text, Tooltip } from '@/TabNewsUI';
import { SquareFillIcon } from '@/TabNewsUI/icons';

export default function TabCoinCount({ amount, direction, sx }) {
  return (
    <Tooltip aria-label="TabCoins" direction={direction ?? 's'} noDelay={true} wrap={true}>
      <Box sx={{ display: 'flex', textWrap: 'nowrap', alignItems: 'center', ...sx }}>
        <SquareFillIcon fill="#0969da" size={16} />
        <Text>{amount?.toLocaleString('pt-BR')}</Text>
      </Box>
    </Tooltip>
  );
}
