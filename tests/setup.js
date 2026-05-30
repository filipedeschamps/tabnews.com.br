import { getQueriesForElement } from '@testing-library/dom';
import { cleanup, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock only in jsdom environment.
if (typeof document !== 'undefined') {
  // Vitest gives each test file a fresh jsdom document, but the testing-library
  // modules persist across files, so the global references they capture at import
  // time go stale. The two patches below re-point them at the current document so
  // tests don't silently target a detached one (which made every file after the
  // first fail).

  // `screen` is bound to `document.body` at import. Rebind it to the live body.
  // Also restore the React act() flag, which rendering async Server Components
  // (e.g. PrimerRoot) leaves unset and would otherwise leak into later files.
  beforeEach(() => {
    Object.assign(screen, getQueriesForElement(document.body));
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  // `userEvent` captures `globalThis.document` at import. Inject the live one so
  // `userEvent.setup()` dispatches events to the document the test renders into.
  // Imported lazily because the module touches `navigator`, which breaks the
  // node-environment suites that also load this file.
  const { userEvent } = await import('@testing-library/user-event');
  if (!userEvent.setup.boundToCurrentDocument) {
    const setup = userEvent.setup;
    userEvent.setup = (options = {}) => setup({ document: globalThis.document, ...options });
    userEvent.setup.boundToCurrentDocument = true;
  }

  afterEach(() => {
    cleanup();
  });

  global.CSS = {
    supports: vi.fn().mockImplementation(() => {
      return false;
    }),
  };

  // jsdom doesn't implement matchMedia, which @primer/react's useMedia hook relies on.
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
