'use client';
import { useTheme } from '@primer/react';
import { useEffect, useLayoutEffect, useState } from 'react';

import { COLOR_MODE_COOKIE } from '../constants/public';
import { ThemeProvider } from '../ThemeProvider';

// `noFlashScript` from `_document.jsx` runs before interactive, setting `data-no-flash` to the cached color mode
const removeNoFlashStyle = () => setTimeout(() => document.documentElement.removeAttribute('data-no-flash'));
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

export function AutoThemeProvider({ children, defaultColorMode, noFlash = true, ...props }) {
  const [colorMode, setColorMode] = useState(defaultColorMode === 'dark' ? 'dark' : 'light');

  useBrowserLayoutEffect(() => {
    const cachedColorMode = localStorage.getItem('colorMode') || colorMode;
    if (noFlash) removeNoFlashStyle();
    if (cachedColorMode == colorMode) return;
    document.documentElement.setAttribute('data-color-mode', cachedColorMode);
    setColorMode(cachedColorMode);
  }, []);

  return (
    <ThemeProvider colorMode={colorMode} {...props}>
      {noFlash && <NoFlashGlobalStyle />}
      <ColorModeCookieSync />
      {children}
    </ThemeProvider>
  );
}

// `visibility: hidden` doesn't hide the canvas, painted with the light background rendered by the server. Chrome
// holds the previous frame while nothing is visible, but Firefox paints the canvas right away, so a dark mode would
// flash white on reload. `:root` outweighs the `html:root` color scheme from `GlobalStyle`, whatever the order.
export function NoFlashGlobalStyle() {
  const { theme } = useTheme();
  const dark = `color-scheme: dark; background-color: ${theme.colorSchemes.dark.colors.canvas.default};`;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: [
          'html[data-no-flash] { visibility: hidden; }',
          `:root[data-no-flash='dark'], :root[data-no-flash='night'] { ${dark} }`,
          `@media (prefers-color-scheme: dark) { :root[data-no-flash='auto'] { ${dark} } }`,
        ].join('\n'),
      }}
      global="true"
    />
  );
}

export function ColorModeCookieSync() {
  const { resolvedColorMode } = useTheme();
  useEffect(() => {
    document.cookie = `${COLOR_MODE_COOKIE}=${resolvedColorMode}; max-age=31536000; path=/`;
  }, [resolvedColorMode]);
}
