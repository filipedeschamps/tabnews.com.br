'use server';
/* eslint-disable @next/next/no-head-element */
import { cookies } from 'next/headers';

import { AutoThemeProvider } from '../AutoThemeProvider/AutoThemeProvider';
import { COLOR_MODE_COOKIE } from '../constants/public';
import { StyledComponentsRegistry } from '../SCRegistry/SCRegistry';

export async function PrimerRoot({ children, colorMode, defaultColorMode, headChildren, htmlProps, lang, ...props }) {
  const cookieStore = await cookies();
  const cachedColorMode = await cookieStore.get(COLOR_MODE_COOKIE);
  const ssrColorMode = (colorMode || cachedColorMode?.value || defaultColorMode) === 'dark' ? 'dark' : 'light';

  return (
    <html lang={lang} suppressHydrationWarning data-color-mode={ssrColorMode} {...htmlProps}>
      <head>
        {headChildren}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"
          integrity="sha384-5TcZemv2l/9On385z///+d7MSYlvIEw9FuZTIdZ14vJLqWphw7e7ZPuOiCHJcFCP"
          crossOrigin="anonymous"
        />
      </head>
      <body data-light-theme="light" data-dark-theme="dark">
        <StyledComponentsRegistry>
          <AutoThemeProvider defaultColorMode={ssrColorMode} noFlash={false} preventSSRMismatch {...props}>
            {children}
          </AutoThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
