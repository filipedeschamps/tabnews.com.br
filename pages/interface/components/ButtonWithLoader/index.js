import { Box, Button, Spinner } from '@/TabNewsUI';

function SpinnerWrapper({ children, isLoading }) {
  const scaleValue = isLoading ? 1 : 0;
  const transformValue = isLoading ? 'translateX(0)' : 'translateX(-12px)';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          marginRight: '8px',
          transform: `scale(${scaleValue})`,
          transition: 'all 500ms ease',
        }}>
        <Spinner size="small" />
      </Box>
      <Box sx={{ transform: transformValue, transition: 'transform 500ms ease' }}>{children}</Box>
    </Box>
  );
}

export default function ButtonWithLoader({ children, disabled, isLoading, ...props }) {
  return (
    <Button {...props} disabled={isLoading || disabled}>
      <SpinnerWrapper isLoading={isLoading}>{children}</SpinnerWrapper>
    </Button>
  );
}
