import clsx from 'clsx';

import { TooltipV1 } from '@/TabNewsUI';

import classes from './index.module.css';

export default function Tooltip({ children, className, position, ...props }) {
  if (position === 'absolute')
    return (
      <div className={classes.AbsoluteWrapper}>
        <div className={clsx(classes.Hidden, className)}>{children}</div>
        <TooltipV1 className={clsx(classes.Tooltip, classes.Absolute, className)} {...props}>
          {children}
        </TooltipV1>
      </div>
    );

  return (
    <TooltipV1 className={clsx(classes.Tooltip, className)} {...props}>
      {children}
    </TooltipV1>
  );
}
