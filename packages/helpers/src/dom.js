/**
 * Checks if the top-left corner of an element is in the upper-left viewport.
 * The upper-left viewport is defined as the area from (0, 0) to (viewportWidth/2, viewportHeight/2).
 * @param {Element} element - The DOM element to check.
 * @returns {boolean} True if the top-left corner of the element is in the upper-left viewport, false otherwise.
 */
export function isTopLeftInUpperLeftViewport(element) {
  if (!element || !(element instanceof Element) || typeof window === 'undefined') return false;

  const rect = element.getBoundingClientRect();
  const viewportWidth = window?.innerWidth;
  const viewportHeight = window?.innerHeight;

  if (!viewportWidth || !viewportHeight) return false;

  return rect.top >= 0 && rect.left >= 0 && rect.top <= viewportHeight / 2 && rect.left <= viewportWidth / 2;
}

/**
 * @typedef {Object} ScrollOptions
 * @property {number} [maxAttempts=10] - Maximum number of attempts to find the element.
 * @property {ScrollBehavior} [behavior='instant'] - Scrolling behavior ('auto', 'smooth', 'instant', etc.).
 * @property {...any} [options] - Additional properties passed to `scrollIntoView`.
 */

/**
 * Scrolls to an element with the specified ID, retrying if the element is not found.
 * If the element is not in the upper left viewport, it will scroll into view.
 * @param {string} id - The ID of the element to scroll to.
 * @param {ScrollOptions} [options] - Options for scrolling behavior.
 * @returns {Function} A cleanup function to cancel the animation frame if needed.
 */
export function scrollToElementWithRetry(id, options) {
  if (typeof id !== 'string' || !id) return () => {};

  const { maxAttempts = 10, behavior = 'instant', ...restOptions } = options || {};

  let attempts = maxAttempts;
  let animationFrameId;

  function attemptScroll() {
    const element = document.getElementById(id);

    if (element) {
      if (!isTopLeftInUpperLeftViewport(element)) {
        element.scrollIntoView({ behavior, ...restOptions });
      }
      return;
    }

    if (attempts > 0) {
      attempts--;
      animationFrameId = requestAnimationFrame(attemptScroll);
    }
  }

  attemptScroll();

  return () => cancelAnimationFrame(animationFrameId);
}
