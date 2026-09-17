import { renderHook } from '@testing-library/react';

import useScrollRestorationOnReload from 'interface/hooks/useScrollRestorationOnReload';

// jsdom doesn't implement `history.scrollRestoration`, so the tests play the part of the Next.js
// router (which sets it to "manual") and of the browser (which fires `pagehide` and `pageshow`).
function dispatchPageTransition(type, persisted) {
  const event = new Event(type);
  event.persisted = persisted;
  window.dispatchEvent(event);
}

describe('useScrollRestorationOnReload', () => {
  afterEach(() => {
    delete window.history.scrollRestoration;
  });

  it('should hand the scroll restoration back to the browser when the document is unloaded', () => {
    window.history.scrollRestoration = 'manual';
    renderHook(() => useScrollRestorationOnReload());

    expect(window.history.scrollRestoration).toBe('manual');

    dispatchPageTransition('pagehide', false);

    expect(window.history.scrollRestoration).toBe('auto');
  });

  it('should set "manual" again when the page is restored from the back/forward cache', () => {
    window.history.scrollRestoration = 'manual';
    renderHook(() => useScrollRestorationOnReload());

    dispatchPageTransition('pagehide', true);
    expect(window.history.scrollRestoration).toBe('auto');

    dispatchPageTransition('pageshow', true);
    expect(window.history.scrollRestoration).toBe('manual');

    dispatchPageTransition('pagehide', true);
    expect(window.history.scrollRestoration).toBe('auto');

    dispatchPageTransition('pageshow', true);
    expect(window.history.scrollRestoration).toBe('manual');
  });

  it('should not change the scroll restoration when it is not "manual"', () => {
    window.history.scrollRestoration = 'auto';
    renderHook(() => useScrollRestorationOnReload());

    dispatchPageTransition('pagehide', true);
    expect(window.history.scrollRestoration).toBe('auto');

    dispatchPageTransition('pageshow', true);
    expect(window.history.scrollRestoration).toBe('auto');
  });

  it('should not change the scroll restoration on `pageshow` without a previous `pagehide`', () => {
    window.history.scrollRestoration = 'auto';
    renderHook(() => useScrollRestorationOnReload());

    dispatchPageTransition('pageshow', false);

    expect(window.history.scrollRestoration).toBe('auto');
  });

  it('should remove the listeners when unmounted', () => {
    window.history.scrollRestoration = 'manual';
    const { unmount } = renderHook(() => useScrollRestorationOnReload());

    dispatchPageTransition('pagehide', true);
    unmount();

    dispatchPageTransition('pageshow', true);
    expect(window.history.scrollRestoration).toBe('auto');

    window.history.scrollRestoration = 'manual';
    dispatchPageTransition('pagehide', false);
    expect(window.history.scrollRestoration).toBe('manual');
  });
});
