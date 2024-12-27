import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      <Script
        id="umami-script"
        src="/analytics.js"
        data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
        data-exclude-search="true"
        strategy="lazyOnload"
      />
      <VercelAnalytics
        beforeSend={(event) => {
          const { pathname } = new URL(event.url);
          if (['/', '/publicar'].includes(pathname)) {
            return null;
          }
          return event;
        }}
      />
    </>
  );
}
