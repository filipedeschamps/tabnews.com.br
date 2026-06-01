'use server';
/* eslint-disable @next/next/no-head-element */
import { cookies } from 'next/headers';

import { AutoThemeProvider } from '../AutoThemeProvider/AutoThemeProvider';
import { COLOR_MODE_COOKIE } from '../constants/public';
import { KatexLoader } from '../KatexLoader/KatexLoader';

export async function PrimerRoot({
  children,
  colorMode,
  defaultColorMode = 'light',
  headChildren = null,
  htmlProps = {},
  lang,
  ...props
}) {
  let ssrColorMode;

  if (colorMode) {
    ssrColorMode = colorMode === 'dark' ? 'dark' : 'light';
  } else {
    const cookieStore = await cookies();
    const cachedColorMode = await cookieStore.get(COLOR_MODE_COOKIE);
    ssrColorMode = (cachedColorMode?.value || defaultColorMode) === 'dark' ? 'dark' : 'light';
  }

  return (
    <html lang={lang} suppressHydrationWarning data-color-mode={ssrColorMode} {...htmlProps}>
      <head>
        {headChildren}
        <KatexLoader />
      </head>
      <body data-light-theme="light" data-dark-theme="dark">
        <AutoThemeProvider defaultColorMode={ssrColorMode} noFlash={false} preventSSRMismatch {...props}>
          {children}
        </AutoThemeProvider>
      </body>
    </html>
  );
}
