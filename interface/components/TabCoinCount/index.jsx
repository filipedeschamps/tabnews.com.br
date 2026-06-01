import clsx from 'clsx';

import { Tooltip } from '@/TabNewsUI';
import { SquareFillIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function TabCoinCount({ amount, direction, mode = 'tooltip', className }) {
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
    <div className={clsx(classes.Wrapper, className)}>
      <SquareFillIcon aria-label={iconLabel} fill="#0969da" size={iconSize} />
      <span>{text}</span>
    </div>
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
