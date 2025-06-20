// Só define mocks quando está em jsdom
if (typeof document !== 'undefined') {
  global.CSS = {
    supports: vi.fn().mockImplementation(() => false),
  };

  // matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));

  // IntersectionObserver
  class IntersectionObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  }

  global.IntersectionObserver = IntersectionObserver;
}
