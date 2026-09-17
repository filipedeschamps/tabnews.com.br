import { vi } from 'vitest';

// The `ui` vitest project runs without isolation and without file parallelism, so
// `vi.mock('next/router', ...)` is effectively shared by every test file in the run: whichever
// file's factory is registered last wins for all of them (see https://vitest.dev/config/#isolate).
// Test files that need `next/router` must import this single mock object instead of declaring
// their own factory, so that whichever registration wins, every file gets the same instance.
export const routerMock = {
  push: vi.fn(),
  prefetch: vi.fn().mockResolvedValue(),
  asPath: '/',
};
