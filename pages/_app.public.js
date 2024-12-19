import { RevalidateProvider } from 'next-swr';
import { SWRConfig } from 'swr';

import { ThemeProvider, Turnstile } from '@/TabNewsUI';
import { Analytics, DefaultHead, UserProvider } from 'pages/interface';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const responseBody = await response.json();

  return { body: responseBody, headers: response.headers };
}

const fallbackData = { body: null, headers: {} };

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Turnstile />
      <UserProvider>
        <DefaultHead />
        <SWRConfig value={{ fetcher: SWRFetcher, fallbackData }}>
          <RevalidateProvider swr={{ swrPath: '/api/v1/swr', ...pageProps.swr }}>
            <Component {...pageProps} />
          </RevalidateProvider>
        </SWRConfig>
        <Analytics />
      </UserProvider>
    </ThemeProvider>
  );
}

export default MyApp;
