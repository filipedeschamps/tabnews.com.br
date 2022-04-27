import { ThemeProvider, BaseStyles, SSRProvider } from '@primer/react';
import './css/globals.css';
import { SWRConfig } from 'swr';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);
  const responseBody = await response.json();

  return responseBody;
}

function MyApp({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        fetcher: SWRFetcher,
      }}>
      <SSRProvider>
        <ThemeProvider preventSSRMismatch colorMode="day">
          <BaseStyles>
            <Component {...pageProps} />
          </BaseStyles>
        </ThemeProvider>
      </SSRProvider>
    </SWRConfig>
  );
}

export default MyApp;
