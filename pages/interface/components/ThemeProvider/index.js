import { BaseStyles, NextNProgress, PrimerThemeProvider, SSRProvider } from '@/TabNewsUI';
import { useEffect, useLayoutEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';

// script to be called before interactive in _document.js
// document.documentElement.setAttribute('data-no-flash', true)
const NoFleshGlobalStyle = createGlobalStyle`html[data-no-flash='true']:root {visibility: hidden}`;
const removeNoFlashStyle = () => setTimeout(() => document.documentElement.removeAttribute('data-no-flash'));
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

export default function ThemeProvider({ children, ...props }) {
  const [colorMode, setColorMode] = useState('day');

  useBrowserLayoutEffect(() => {
    const cachedColorMode = localStorage.getItem('colorMode') || 'auto';
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
        </BaseStyles>
      </PrimerThemeProvider>
    </SSRProvider>
  );
}
