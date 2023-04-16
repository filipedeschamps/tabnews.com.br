import { ThemeProvider } from '@/TabNewsUI';
import { Analytics } from '@vercel/analytics/react';
import { useRevalidate } from 'next-swr';
import { DefaultHead, UserProvider } from 'pages/interface';
import { SWRConfig } from 'swr';

async function SWRFetcher(resource, init) {
  const response = await fetch(resource, init);
  const responseBody = await response.json();

  return responseBody;
}

function MyApp({ Component, pageProps }) {
  useRevalidate({ swr: { swrPath: '/api/v1/swr', ...pageProps.swr } });
  return (
    <UserProvider>
      <DefaultHead />
      <SWRConfig value={{ fetcher: SWRFetcher }}>
        <ThemeProvider>
          <Component {...pageProps} />
        </ThemeProvider>
      </SWRConfig>
      <Analytics />
    </UserProvider>
  );
}

export default MyApp;
