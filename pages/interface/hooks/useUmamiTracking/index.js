import umami from '@umami/node';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const isValidPageForTracking = (routerPath, validPages) => {
  return validPages.some((page) => routerPath.startsWith(page));
};

export default function useUmamiTracking() {
  const router = useRouter();
  const trackedPaths = useRef(new Set());

  useEffect(() => {
    const isUmamiEnabled = process.env.NEXT_PUBLIC_UMAMI_ENABLED === 'true';

    const validPages = ['/login', '/cadastro'];

    if (!isUmamiEnabled) return;

    if (!umami.initCalled) {
      umami.init({
        websiteId: process.env.NEXT_PUBLIC_UMAMI_ID_WEBSITE,
        hostUrl: 'https://cloud.umami.is',
      });
      umami.initCalled = true;
    }

    const trackPageView = (url) => {
      if (!trackedPaths.current.has(url)) {
        try {
          umami.track({
            url,
            hostname: window.location.hostname,
            language: window.navigator.language,
            screen: `${window.screen.width}x${window.screen.height}`,
            title: document.title,
          });
          trackedPaths.current.add(url);
        } catch (error) {
          console.error(`Error tracking page view for URL: ${url}`, error);
        }
      }
    };

    const currentPath = router.asPath;

    if (isValidPageForTracking(currentPath, validPages)) {
      trackPageView(currentPath);
    }

    const handleRouteChange = (url) => {
      if (isValidPageForTracking(url, validPages)) {
        trackPageView(url);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return null;
}
