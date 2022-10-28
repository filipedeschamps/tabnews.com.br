import { ThemeProvider, BaseStyles, SSRProvider } from '@primer/react';
import { Analytics } from '@vercel/analytics/react';
import { SWRConfig } from 'swr';
import { UserProvider } from 'pages/interface/hooks/useUser/index.js';
import NextNProgress from 'pages/interface/components/Progressbar/index.js';
import { DefaultHead } from 'pages/interface/components/Head/index.js';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);
  const responseBody = await response.json();

  return responseBody;
}

function MyApp({ Component, pageProps }) {
  return (
    <>
      <UserProvider>
        <DefaultHead />
        <SWRConfig
          value={{
            fetcher: SWRFetcher,
          }}>
          <SSRProvider>
            <ThemeProvider preventSSRMismatch colorMode="day">
              <BaseStyles>
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
