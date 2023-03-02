import { useCallback, useEffect } from 'react';
import { useTheme } from '@primer/react';

export default function useThemeMode() {
  const { theme, colorMode, setColorMode } = useTheme();

  const setThemeMode = useCallback(
    (mode) => {
      const scheme = mode === 'day' ? 'light' : 'dark';
      const defaultBorder = theme.colorSchemes[scheme].colors.border.default;
      const defaultFgColor = theme.colorSchemes[scheme].colors.fg.default;
      const defaultBgColor = theme.colorSchemes[scheme].colors.canvas.default;

      setColorMode(mode);
      localStorage.setItem('themeMode', JSON.stringify({ mode, scheme, default: defaultBgColor }));

      if (document.head.querySelector('style[data-theme]')) {
        document.head.querySelector('style[data-theme]').remove();
      }

      const style = document.createElement('style');
      style.dataset.theme = mode;
      style.innerHTML = `
          body { background-color: ${defaultBgColor} !important; }
          .bytemd-toolbar-icon:hover { background-color: ${defaultBorder} !important; }
          .markdown-body, .bytemd, .bytemd-toolbar, .bytemd-editor > div {
            color: ${defaultFgColor} !important;
            border-color: ${defaultBorder} !important;
            background-color: ${defaultBgColor} !important;
          }
        `;
      document.head.appendChild(style);
    },
    [setColorMode, theme]
  );

  useEffect(() => {
    const themeLocalStorage = JSON.parse(localStorage.getItem('themeMode'));

    if (themeLocalStorage) {
      setThemeMode(themeLocalStorage.mode);
    }
  }, [theme, setThemeMode]);

  return { colorMode, setThemeMode };
}
