import { AutoThemeProvider, NextNProgress } from '@/TabNewsUI';

export default function ThemeProvider({ children, ...props }) {
  return (
    <AutoThemeProvider {...props}>
      <NextNProgress options={{ showSpinner: false }} />
      {children}
    </AutoThemeProvider>
  );
}
