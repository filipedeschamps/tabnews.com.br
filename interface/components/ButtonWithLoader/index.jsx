import { Button, Spinner } from '@/TabNewsUI';

import classes from './index.module.css';

function SpinnerWrapper({ children, isLoading }) {
  const scaleValue = isLoading ? 1 : 0;
  const transformValue = isLoading ? 'translateX(0)' : 'translateX(-12px)';

  return (
    <div className={classes.Wrapper}>
      <div className={classes.Spinner} style={{ transform: `scale(${scaleValue})` }}>
        <Spinner size="small" />
      </div>
      <div className={classes.Content} style={{ transform: transformValue }}>
        {children}
      </div>
    </div>
  );
}

export default function ButtonWithLoader({ children, disabled, isLoading, ...props }) {
  return (
    <Button {...props} disabled={isLoading || disabled}>
      <SpinnerWrapper isLoading={isLoading}>{children}</SpinnerWrapper>
    </Button>
  );
}
