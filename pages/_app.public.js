import { ThemeProvider } from '@/TabNewsUI';
import { Analytics } from '@vercel/analytics/react';
import { RevalidateProvider } from 'next-swr';
import { DefaultHead, UserProvider } from 'pages/interface';
import { SWRConfig } from 'swr';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);
  const responseBody = await response.json();

  return responseBody;
}

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <DefaultHead />
        <SWRConfig value={{ fetcher: SWRFetcher }}>
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
