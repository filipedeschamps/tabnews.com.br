import { act, render, waitFor } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { RevalidateProvider } from 'next-swr';

import PastTime from 'interface/components/PastTime';

const serverNow = new Date('2024-05-01T12:00:00.000Z').getTime();
const deviceClockSkew = 10 * 60 * 1000;

// `RevalidateProvider` reads the router to revalidate on route change, and the test renders it for
// real so the `/api/v1/swr` round trip that measures the clock offset is exercised end to end.
const router = {
  asPath: '/',
  events: { on: vi.fn(), off: vi.fn() },
  prefetch: vi.fn(),
  replace: vi.fn(),
};

function wrapper({ children }) {
  return (
    <RouterContext.Provider value={router}>
      <RevalidateProvider swr={{ swrPath: '/api/v1/swr' }}>{children}</RevalidateProvider>
    </RouterContext.Provider>
  );
}

function renderPastTime(props) {
  const { container } = render(<PastTime {...props} />, { wrapper });
  return () => container.querySelector('time').textContent;
}

describe('PastTime', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ timestamp: serverNow }),
    });
  });

  afterEach(async () => {
    // The offset is measured in a `setTimeout`, so a test that doesn't wait for the resulting
    // re-render would leave it to land after the test ended, outside `act()`.
    await act(() => vi.advanceTimersByTimeAsync(0));
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should use the device clock until the offset is measured, then the server clock', async () => {
    vi.setSystemTime(serverNow + deviceClockSkew);
    const text = renderPastTime({ date: new Date(serverNow - 5000).toISOString() });

    expect(text()).toBe('10 minutos atrás');

    await waitFor(() => expect(text()).toBe('5 segundos atrás'));
  });

  it('should measure the distance from the server clock if the device clock is behind', async () => {
    vi.setSystemTime(serverNow - deviceClockSkew);
    const text = renderPastTime({ date: new Date(serverNow - 5000).toISOString() });

    expect(text()).toBe('10 minutos atrás');

    await waitFor(() => expect(text()).toBe('5 segundos atrás'));
  });

  it('should apply `formatText` to the distance', () => {
    vi.setSystemTime(serverNow);
    const text = renderPastTime({
      date: new Date(serverNow - 60 * 60 * 1000).toISOString(),
      formatText: (date) => `Membro há ${date}`,
    });

    expect(text()).toBe('Membro há 1 hora');
  });

  it('should render an empty text if the date is invalid', () => {
    vi.setSystemTime(serverNow);
    const text = renderPastTime({ date: 'not a date' });

    expect(text()).toBe('');
  });
});
