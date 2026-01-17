import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock only in jsdom environment.
if (typeof document !== 'undefined') {
  afterEach(() => {
    cleanup();
  });

  global.CSS = {
    supports: vi.fn().mockImplementation(() => {
      return false;
    }),
  };
}
