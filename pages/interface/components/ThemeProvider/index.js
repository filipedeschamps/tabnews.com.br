import { AutoThemeProvider, NextNProgress, ViewerStyles } from '@/TabNewsUI';

export default function ThemeProvider({ children, ...props }) {
  return (
    <AutoThemeProvider {...props}>
      <NextNProgress options={{ showSpinner: false }} />
      {children}
      <ViewerStyles />
    </AutoThemeProvider>
  );
}
