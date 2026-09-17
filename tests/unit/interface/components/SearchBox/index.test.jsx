import { act, render, renderHook } from '@testing-library/react';
import { useState } from 'react';

import useSearchBox from '@/SearchBox';

// Regression test for #1647: clicking a search result, navigating back (bfcache restore)
// and clicking another result made all results vanish, as if the search had restarted.
// Root cause: SearchBoxOverlay (and the Google CSE widget it mounts) was defined inside
// useSearchBox(), so any unrelated re-render of whatever consumes the hook (e.g. the
// Header re-rendering after a focus-triggered SWR revalidation, which reliably happens
// when a bfcache-restored tab regains focus) recreated its identity and remounted it,
// re-injecting the Google CSE script and wiping the current query/results.
describe('useSearchBox', () => {
  it('keeps the SearchBoxOverlay component identity stable across re-renders while open', () => {
    const { result, rerender } = renderHook(() => useSearchBox());

    act(() => {
      result.current.onClickSearchButton({ target: document.body });
    });

    const overlayAfterOpen = result.current.SearchBoxOverlay;

    rerender();
    rerender();

    expect(result.current.SearchBoxOverlay).toBe(overlayAfterOpen);
  });

  it('changes the SearchBoxOverlay component identity when it opens or closes', () => {
    const { result } = renderHook(() => useSearchBox());
    const overlayWhileClosed = result.current.SearchBoxOverlay;

    act(() => {
      result.current.onClickSearchButton({ target: document.body });
    });

    expect(result.current.SearchBoxOverlay).not.toBe(overlayWhileClosed);
  });

  it('does not re-inject the Google CSE script when an unrelated re-render happens while the overlay stays open', () => {
    function Harness() {
      const [, forceRerender] = useState(0);
      const { SearchBoxOverlay, onClickSearchButton } = useSearchBox();

      return (
        <div>
          <button onClick={() => onClickSearchButton({ target: document.body })}>abrir</button>
          <button onClick={() => forceRerender((n) => n + 1)}>rerender</button>
          <SearchBoxOverlay />
        </div>
      );
    }

    const { getByText } = render(<Harness />);
    const scriptCount = () => document.querySelectorAll('script[src*="cse.js"]').length;

    act(() => {
      getByText('abrir').click();
    });

    const scriptCountAfterOpen = scriptCount();

    act(() => {
      getByText('rerender').click();
    });
    act(() => {
      getByText('rerender').click();
    });

    expect(scriptCount()).toBe(scriptCountAfterOpen);
  });
});
