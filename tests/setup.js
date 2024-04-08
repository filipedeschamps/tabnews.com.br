// Copied and adapted from https://github.com/primer/react/blob/main/packages/react/src/utils/test-helpers.tsx.
// Can't import it because it is using `jest` instead of `vitest`.

import { TextEncoder } from 'node:util';

// Mock only in jsdom environment.
if (typeof document !== 'undefined') {
  // JSDOM doesn't mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => {
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    };
  });

  global.CSS = {
    escape: vi.fn(),
    supports: vi.fn().mockImplementation(() => {
      return false;
    }),
  };

  global.TextEncoder = TextEncoder;

  /**
   * Required for internal usage of dialog in primer/react
   * this is not implemented in JSDOM, and until it is we'll need to polyfill
   * https://github.com/jsdom/jsdom/issues/3294
   * https://vijs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
   * bonus: we only want to mock browser globals in DOM (or js-dom) environments – not in SSR / node
   */
  global.HTMLDialogElement.prototype.showModal = vi.fn(function mock() {
    // eslint-disable-next-line no-invalid-this
    this.open = true;
  });

  global.HTMLDialogElement.prototype.close = vi.fn(function mock() {
    // eslint-disable-next-line no-invalid-this
    this.open = false;
  });

  // Add a fallback for scrollIntoView if it does not exist in the test
  // environment.
  if (global.Element.prototype.scrollIntoView === undefined) {
    global.Element.prototype.scrollIntoView = vi.fn();
  }
}
