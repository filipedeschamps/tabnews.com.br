'use client';
import { useTheme } from '@primer/react';
import { useEffect, useLayoutEffect, useState } from 'react';

import { COLOR_MODE_COOKIE } from '../constants/public';
import { ThemeProvider } from '../ThemeProvider';

// script to be called before interactive in _document.js
// if (['auto','night'].includes(localStorage.getItem('colorMode')))
// document.documentElement.setAttribute('data-no-flash', true)

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

export function NoFlashGlobalStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: "html[data-no-flash='true'] { visibility: hidden; }",
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
