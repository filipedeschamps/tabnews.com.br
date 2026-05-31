import clsx from 'clsx';

import { Text, Tooltip } from '@/TabNewsUI';
import { SquareFillIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function TabCashCount({ amount, direction, mode = 'tooltip', className }) {
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
    <div className={clsx(classes.Wrapper, className)}>
      <SquareFillIcon aria-label={iconLabel} fill="#2da44e" size={iconSize} />
      <Text>{text}</Text>
    </div>
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
