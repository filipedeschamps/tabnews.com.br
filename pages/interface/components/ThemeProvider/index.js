import { BaseStyles, NextNProgress, PrimerThemeProvider, SSRProvider, ViewerStyles, useTheme } from '@/TabNewsUI';
import { useEffect, useLayoutEffect, useState } from 'react';

// script to be called before interactive in _document.js
// if (['auto','night'].includes(localStorage.getItem('colorMode')))
// document.documentElement.setAttribute('data-no-flash', true)

const removeNoFlashStyle = () => setTimeout(() => document.documentElement.removeAttribute('data-no-flash'));
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

export default function ThemeProvider({ children, defaultColorMode, ...props }) {
  const [colorMode, setColorMode] = useState(defaultColorMode === 'night' ? 'night' : 'day');

  useBrowserLayoutEffect(() => {
    const cachedColorMode = localStorage.getItem('colorMode') || colorMode;
    if (cachedColorMode == colorMode) return;
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

function NoFleshGlobalStyle() {
  const {
    resolvedColorScheme,
    theme: { colors },
  } = useTheme();
  return (
    <style jsx global>{`
      html[data-no-flash='true']:root {
        visibility: hidden;
      }
      html:root {
        color-scheme: ${resolvedColorScheme};
      }
      body {
        background: ${colors.canvas.default};
      }
    `}</style>
  );
}
