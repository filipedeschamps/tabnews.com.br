import { ThemeProvider, BaseStyles, SSRProvider } from '@primer/react';
import { SWRConfig } from 'swr';
import { UserProvider } from 'pages/interface/hooks/useUser/index.js';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);
  const responseBody = await response.json();

  return responseBody;
}

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
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
    </UserProvider>
  );
}

export default MyApp;
