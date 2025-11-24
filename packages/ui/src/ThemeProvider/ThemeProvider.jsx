import { BaseStyles, ThemeProvider as PrimerThemeProvider, useTheme } from '@primer/react';

export function ThemeProvider({ children, ...props }) {
  return (
    <PrimerThemeProvider {...props}>
      <GlobalStyle />
      <BaseStyles>{children}</BaseStyles>
    </PrimerThemeProvider>
  );
}

export function GlobalStyle() {
  const {
    resolvedColorScheme,
    theme: { colors },
  } = useTheme();
  return (
    <style jsx="true" global="true">{`
      html:root {
        color-scheme: ${resolvedColorScheme};
      }
      body {
        background: ${colors.canvas.default};
      }
    `}</style>
  );
}
