import { ThemeProvider, BaseStyles, SSRProvider } from '@primer/react';
import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SWRConfig } from 'swr';
import { UserProvider } from 'pages/interface/hooks/useUser/index.js';
import NextNProgress from 'pages/interface/components/Progressbar/index.js';
import { DefaultHead } from 'pages/interface/components/Head/index.js';
import { useMediaQuery } from './interface';
import { customTheme } from 'theme';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);
  const responseBody = await response.json();

  return responseBody;
}

function MyApp({ Component, pageProps }) {
  const [colorMode, setColorMode] = useState(null);
  const systemTheme = useMediaQuery('(prefers-color-scheme: dark)') ? 'night' : 'day';

  useEffect(() => {
    const theme = document.querySelector('html').getAttribute('data-theme');

    setColorMode(theme || systemTheme);
  }, [setColorMode, systemTheme]);

  if (!colorMode) return;

  return (
    <>
      <UserProvider>
        <DefaultHead />
        <SWRConfig
          value={{
            fetcher: SWRFetcher,
          }}>
          <SSRProvider>
            <ThemeProvider preventSSRMismatch colorMode="dark" theme={customTheme}>
              <BaseStyles backgroundColor={'canvas.inset'}>
                <NextNProgress options={{ showSpinner: false }} />
                <Component {...pageProps} />
              </BaseStyles>
            </ThemeProvider>
          </SSRProvider>
        </SWRConfig>
      </UserProvider>
      <Analytics />
    </>
  );
}

export default MyApp;
