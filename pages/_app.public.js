import { ThemeProvider, BaseStyles, SSRProvider } from '@primer/react';
import { useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { useMediaQuery } from './interface';

import '../styles/bytemd.css';
import '../styles/github.scss';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);
  const responseBody = await response.json();

  return responseBody;
}

function MyApp({ Component, pageProps }) {
  const [colorMode, setColorMode] = useState(null);
  const systemTheme = useMediaQuery('(prefers-color-scheme: dark)') ? 'night' : 'day';

  useEffect(() => {
    const theme = document
      .querySelector('html')
      .getAttribute('data-theme');

    setColorMode(theme || systemTheme);
  }, [setColorMode, systemTheme]);

  if (!colorMode) return;
  return (
    <SWRConfig
      value={{
        fetcher: SWRFetcher,
      }}>
      <SSRProvider>
        <ThemeProvider preventSSRMismatch colorMode={colorMode}>
          <BaseStyles>
            <Component {...pageProps} />
          </BaseStyles>
        </ThemeProvider>
      </SSRProvider>
    </SWRConfig>
  );
}

export default MyApp;
