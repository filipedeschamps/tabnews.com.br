import { ThemeProvider, BaseStyles, SSRProvider } from '@primer/react';
import './css/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <SSRProvider>
      <ThemeProvider preventSSRMismatch colorMode="day">
        <BaseStyles>
          <Component {...pageProps} />
        </BaseStyles>
      </ThemeProvider>
    </SSRProvider>
  );
}

export default MyApp;
