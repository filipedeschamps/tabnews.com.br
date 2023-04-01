import { BaseStyles, NextNProgress, PrimerThemeProvider, SSRProvider, ViewerStyles } from '@/TabNewsUI';
import { useEffect, useLayoutEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

// script to be called before interactive in _document.js
// document.documentElement.setAttribute('data-no-flash', true)
const NoFleshGlobalStyle = createGlobalStyle`html[data-no-flash='true']:root {visibility: hidden}`;
const removeNoFlashStyle = () => setTimeout(() => document.documentElement.removeAttribute('data-no-flash'));
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

export default function ThemeProvider({ children, defaultColorMode, ...props }) {
  const [colorMode, setColorMode] = useState(defaultColorMode === 'night' ? 'night' : 'day');

  useBrowserLayoutEffect(() => {
    const cachedColorMode = localStorage.getItem('colorMode') || colorMode;
    setColorMode(cachedColorMode);
    removeNoFlashStyle();
  }, []);

  return (
    <SSRProvider>
      <PrimerThemeProvider colorMode={colorMode} {...props}>
        <BaseStyles>
          <NextNProgress options={{ showSpinner: false }} />
          <NoFleshGlobalStyle />
          {children}
          <ViewerStyles />
        </BaseStyles>
      </PrimerThemeProvider>
    </SSRProvider>
  );
}
