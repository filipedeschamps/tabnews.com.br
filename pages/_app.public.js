import { BaseStyles, NextNProgress, PrimerThemeProvider, SSRProvider } from '@/TabNewsUI';
import { Analytics } from '@vercel/analytics/react';
import { DefaultHead, UserProvider } from 'pages/interface';
import { SWRConfig } from 'swr';

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
            <PrimerThemeProvider preventSSRMismatch colorMode="day">
              <BaseStyles>
                <NextNProgress options={{ showSpinner: false }} />
                <Component {...pageProps} />
              </BaseStyles>
            </PrimerThemeProvider>
          </SSRProvider>
        </SWRConfig>
      </UserProvider>
      <Analytics />
    </>
  );
}

export default MyApp;
