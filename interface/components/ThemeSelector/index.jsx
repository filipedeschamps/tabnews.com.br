import clsx from 'clsx';

import { Button, SegmentedControl, useTheme } from '@/TabNewsUI';
import { MoonIcon, SunIcon } from '@/TabNewsUI/icons';

import classes from './index.module.css';

export default function ThemeSelector({ onSelect, as: As = 'div', className, sx, ...props }) {
  const { colorMode, setColorMode } = useTheme();

  const handleChangeColorMode = (index) => {
    const mode = ['dark', 'auto', 'light'][index];
    setColorMode(mode);
    onSelect?.(mode);
    localStorage.setItem('colorMode', mode);
  };

  return (
    <As className={clsx(classes.Wrapper, className)} {...props}>
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
    </As>
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
      className={clsx(classes.Switcher, isLight ? classes.SwitcherLight : classes.SwitcherDark)}
      {...props}>
      {isLight ? <MoonIcon size={16} /> : <SunIcon size={16} />}
    </Button>
  );
}
