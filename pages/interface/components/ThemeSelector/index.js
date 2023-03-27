import { Box, SegmentedControl, useTheme, Button } from '@/TabNewsUI';
import { MoonIcon, SunIcon } from '@primer/octicons-react';

export default function ThemeSelector({ ...props }) {
  const { colorMode, setColorMode } = useTheme();

  const handleChangeColorMode = (mode) => {
    setColorMode(mode);
    localStorage.setItem('colorMode', mode);
  };

  return (
    <Box sx={{ maxWidth: '160px', mx: 'auto', color: 'accent.emphasis' }} {...props}>
      <SegmentedControl aria-label="Tema claro, auto ou escuro" size="small" fullWidth>
        <SegmentedControl.IconButton
          aria-label="Tema escuro"
          selected={['night', 'dark'].includes(colorMode)}
          onClick={() => handleChangeColorMode('night')}
          icon={MoonIcon}
          size="small"
        />
        <SegmentedControl.Button
          aria-label="Tema automático"
          selected={'auto' === colorMode}
          onClick={() => handleChangeColorMode('auto')}
          size="small">
          Auto
        </SegmentedControl.Button>
        <SegmentedControl.IconButton
          aria-label="Tema claro"
          selected={['day', 'light'].includes(colorMode)}
          onClick={() => handleChangeColorMode('day')}
          icon={SunIcon}
          size="small"
        />
      </SegmentedControl>
    </Box>
  );
}

export function ThemeSwitcher({ ...props }) {
  const { resolvedColorMode: mode, setColorMode } = useTheme();

  const handleSwitchMode = () => {
    const newMode = mode === 'day' ? 'night' : 'day';
    setColorMode(newMode);
    localStorage.setItem('colorMode', newMode);
  };

  return (
    <Button
      onClick={handleSwitchMode}
      variant="invisible"
      sx={{
        color: mode === 'day' ? '#e7dfc3' : '#ecdc0f99',
        '&:hover': {
          color: mode === 'day' ? '#e7dfc370' : '#ecdc0f',
          backgroundColor: 'transparent',
        },
      }}
      {...props}>
      {mode === 'day' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
    </Button>
  );
}
