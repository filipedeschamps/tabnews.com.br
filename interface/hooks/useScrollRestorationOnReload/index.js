import { useEffect } from 'react';

// With `experimental.scrollRestoration`, the Next.js router sets `history.scrollRestoration` to
// "manual" and only restores the position on `popstate`. The mode is kept in the history entry, so a
// reload of that entry skips the browser's own restoration and the page opens at the top. Handing
// the entry back to the browser as the document leaves lets the reload (or a return from another
// document) restore natively, and the router sets "manual" again once the new document hydrates.
export default function useScrollRestorationOnReload() {
  useEffect(() => {
    function handlePageHide() {
      if (window.history.scrollRestoration !== 'manual') return;

      window.history.scrollRestoration = 'auto';

      // Restored from the back/forward cache: the router was not recreated, so it doesn't set it again.
      window.addEventListener('pageshow', restoreManualScrollRestoration, { once: true });
    }

    function restoreManualScrollRestoration() {
      window.history.scrollRestoration = 'manual';
    }

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', restoreManualScrollRestoration);
    };
  }, []);
}
