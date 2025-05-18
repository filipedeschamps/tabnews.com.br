import Script from 'next/script';

export default function Analytics() {
  return (
    <Script
      id="umami-script"
      src={process.env.NEXT_PUBLIC_UMAMI_ENDPOINT + '/script.js'}
      data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
      data-exclude-search="true"
      strategy="lazyOnload"
    />
  );
}
