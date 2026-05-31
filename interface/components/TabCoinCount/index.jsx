import { Box, Text, Tooltip } from '@/TabNewsUI';
import { SquareFillIcon } from '@/TabNewsUI/icons';

export default function TabCoinCount({ amount, direction, mode = 'tooltip', sx }) {
  const modes = {
    tooltip: {
      iconLabel: 'TabCoins',
      iconSize: 16,
      text: amount?.toLocaleString('pt-BR'),
    },
    full: {
      iconSize: 20,
      text: `${amount?.toLocaleString('pt-BR')} TabCoin${amount > 1 || amount < -1 ? 's' : ''}`,
    },
  };

  const { iconLabel, iconSize, text } = modes[mode];

  const content = (
    <Box sx={{ display: 'flex', textWrap: 'nowrap', alignItems: 'center', ...sx }}>
      <SquareFillIcon aria-label={iconLabel} fill="#0969da" size={iconSize} />
      <Text>{text}</Text>
    </Box>
  );

  if (mode === 'full') {
    return content;
  }

  return (
    <Tooltip text="TabCoins" direction={direction ?? 's'}>
      {content}
    </Tooltip>
  );
}
