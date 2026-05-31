import { Box, Button, SegmentedControl, useTheme } from '@/TabNewsUI';
import { MoonIcon, SunIcon } from '@/TabNewsUI/icons';

export default function ThemeSelector({ onSelect, sx, ...props }) {
  const { colorMode, setColorMode } = useTheme();

  const handleChangeColorMode = (index) => {
    const mode = ['dark', 'auto', 'light'][index];
    setColorMode(mode);
    onSelect?.(mode);
    localStorage.setItem('colorMode', mode);
  };

  return (
    <Box sx={{ maxWidth: '160px', mx: 'auto', color: 'accent.emphasis', ...sx }} {...props}>
      <SegmentedControl
        aria-label="Seletor de tema: claro, automático ou escuro"
        size="small"
        onChange={handleChangeColorMode}
        fullWidth>
        <SegmentedControl.IconButton
          aria-label="Tema escuro"
          selected={['night', 'dark'].includes(colorMode)}
          icon={MoonIcon}
          size="small"
        />
        <SegmentedControl.Button aria-label="Tema automático" selected={'auto' === colorMode} size="small">
          Auto
        </SegmentedControl.Button>
        <SegmentedControl.IconButton
          aria-label="Tema claro"
          selected={['day', 'light'].includes(colorMode)}
          icon={SunIcon}
          size="small"
        />
      </SegmentedControl>
    </Box>
  );
}

export function ThemeSwitcher({ ...props }) {
  const { resolvedColorMode: mode, setColorMode } = useTheme();
  const isLight = ['day', 'light'].includes(mode);

  const handleSwitchMode = () => {
    const newMode = isLight ? 'dark' : 'light';
    setColorMode(newMode);
    localStorage.setItem('colorMode', newMode);
  };

  return (
    <Button
      aria-label='Alternar tema entre "claro" e "escuro"'
      onClick={handleSwitchMode}
      variant="invisible"
      sx={{
        color: isLight ? '#e7dfc3' : '#ecdc0f99',
        '&:hover': {
          color: isLight ? '#e7dfc370' : '#ecdc0f',
          backgroundColor: 'transparent',
        },
        '&:focus-visible': {
          outline: '2px solid #FFF',
        },
        px: '7px',
        pb: '3px',
      }}
      {...props}>
      {isLight ? <MoonIcon size={16} /> : <SunIcon size={16} />}
    </Button>
  );
}
