import { isTopLeftInUpperLeftViewport, scrollToElementWithRetry } from '.';

describe('helpers/dom', () => {
  beforeAll(() => {
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {};
    }
  });

  describe('isTopLeftInUpperLeftViewport', () => {
    it('returns false if element is null', () => {
      expect(isTopLeftInUpperLeftViewport(null)).toBe(false);
    });

    it('returns true if element is in the upper-left viewport', () => {
      const el = createMockElement({
        top: 100,
        left: 100,
        width: 50,
        height: 50,
      });
      setWindowSize(800, 600);

      expect(isTopLeftInUpperLeftViewport(el)).toBe(true);
    });

    it('returns false if element is outside the upper viewport', () => {
      const el = createMockElement({
        top: 301,
        left: 200,
        width: 50,
        height: 50,
      });
      setWindowSize(800, 600);

      expect(isTopLeftInUpperLeftViewport(el)).toBe(false);
    });

    it('returns false if element is outside the left viewport', () => {
      const el = createMockElement({
        top: 100,
        left: 401,
        width: 50,
        height: 50,
      });
      setWindowSize(800, 600);

      expect(isTopLeftInUpperLeftViewport(el)).toBe(false);
    });

    it('returns false if element is outside both upper and left viewport', () => {
      const el = createMockElement({
        top: 241,
        left: 321,
        width: 50,
        height: 50,
      });
      setWindowSize(640, 480);

      expect(isTopLeftInUpperLeftViewport(el)).toBe(false);
    });

    it('returns false if element is not an instance of Element', () => {
      expect(isTopLeftInUpperLeftViewport({})).toBe(false);
      expect(isTopLeftInUpperLeftViewport('string')).toBe(false);
      expect(isTopLeftInUpperLeftViewport(123)).toBe(false);
    });

    it('returns false if window dimensions are not available', () => {
      const el = createMockElement({
        top: 100,
        left: 100,
        width: 50,
        height: 50,
      });

      setWindowSize(undefined, undefined);
      expect(isTopLeftInUpperLeftViewport(el)).toBe(false);

      setWindowSize(800, undefined);
      expect(isTopLeftInUpperLeftViewport(el)).toBe(false);

      setWindowSize(undefined, 600);
      expect(isTopLeftInUpperLeftViewport(el)).toBe(false);

      setWindowSize(0, 0);
      expect(isTopLeftInUpperLeftViewport(el)).toBe(false);

      setWindowSize(800, 600);
      expect(isTopLeftInUpperLeftViewport(el)).toBe(true);
    });
  });

  describe('scrollToElementWithRetry', () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.spyOn(window, 'cancelAnimationFrame').mockResolvedValue();
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        return setTimeout(cb, 0);
      });

      setWindowSize(1024, 768);
      document.body.innerHTML = '';
    });

    afterEach(() => {
      vi.clearAllMocks();
      document.body.innerHTML = '';
    });

    it('scrolls to element if found and not in viewport', () => {
      const el = createMockElement(
        {
          top: 400,
          left: 500,
          width: 50,
          height: 50,
        },
        'test',
      );

      scrollToElementWithRetry('test');

      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant' });
    });

    it('does not scroll if element is already in the upper-left viewport', () => {
      const el = createMockElement(
        {
          top: 100,
          left: 100,
          width: 50,
          height: 50,
        },
        'test',
      );

      scrollToElementWithRetry('test', { behavior: 'smooth' });
      vi.runAllTimers();

      expect(el.scrollIntoView).not.toHaveBeenCalled();
    });

    it('retries until the element is found and then scrolls into view', () => {
      let triggerAnimationFrame = () => {};

      vi.spyOn(window, 'requestAnimationFrame').mockImplementationOnce((cb) => {
        const time = performance.now();
        triggerAnimationFrame = () => cb(time);
        return time;
      });

      // Initially, element with id "delayed" does not exist.
      scrollToElementWithRetry('delayed', { maxAttempts: 3, behavior: 'auto' });
      expect(document.getElementById('delayed')).toBeNull();

      const el = createMockElement(
        {
          top: 400,
          left: 200,
          width: 50,
          height: 50,
        },
        'delayed',
      );

      // Simulate the animation frame before the element is added
      triggerAnimationFrame();

      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
    });

    it('stops retrying after reaching maxAttempts', () => {
      scrollToElementWithRetry('missing', { maxAttempts: 3 });

      vi.runAllTimers();

      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3);
    });

    it('returns a cleanup function that cancels scheduled animation frame', () => {
      const cleanup = scrollToElementWithRetry('non-existent', { maxAttempts: 2 });

      expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
      expect(() => cleanup()).not.toThrow();
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('does not throw if the ID is not a valid string', () => {
      const cleanup = scrollToElementWithRetry(123, { maxAttempts: 2 });

      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      expect(() => cleanup()).not.toThrow();
      expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
    });

    it('does not throw if the ID is an empty string', () => {
      const cleanup = scrollToElementWithRetry('', { maxAttempts: 2 });

      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
      expect(() => cleanup()).not.toThrow();
      expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
    });
  });
});

function createMockElement(rect, id) {
  const el = document.createElement('div');

  if (id) el.id = id;

  el.getBoundingClientRect = () => ({
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
  });

  document.body.appendChild(el);

  vi.spyOn(el, 'scrollIntoView');

  return el;
}

function setWindowSize(width, height) {
  window.innerWidth = width;
  window.innerHeight = height;
}
