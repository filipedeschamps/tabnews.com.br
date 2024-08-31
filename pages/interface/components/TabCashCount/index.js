import { Box, Text, Tooltip } from '@/TabNewsUI';
import { SquareFillIcon } from '@/TabNewsUI/icons';

export default function TabCashCount({ amount, direction, mode = 'tooltip', sx }) {
  const modes = {
    tooltip: {
      iconLabel: 'TabCash',
      iconSize: 16,
      text: amount?.toLocaleString('pt-BR'),
    },
    full: {
      iconSize: 20,
      text: `${amount?.toLocaleString('pt-BR')} TabCash`,
    },
  };

  const { iconLabel, iconSize, text } = modes[mode];

  const content = (
    <Box sx={{ display: 'flex', textWrap: 'nowrap', alignItems: 'center', ...sx }}>
      <SquareFillIcon aria-label={iconLabel} fill="#2da44e" size={iconSize} />
      <Text>{text}</Text>
    </Box>
  );

  if (mode === 'full') {
    return content;
  }

  return (
    <Tooltip text="TabCash" direction={direction ?? 's'}>
      {content}
    </Tooltip>
  );
}
